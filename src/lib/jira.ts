import { jiraAPI } from '.'
import { query } from '../db'

/** Class representing a metric. */
export abstract class Metrics {
  type: string | undefined
  date: string | undefined
  approved: number | undefined | null
  rejected: number | undefined | null
  submitted: number | undefined | null
  pending: number | undefined | null

  /**
   * Sets the date for the metric.
   * @param {string} date - YYYY-MM-DD
   */
  set setDate(date: string) {
    this.date = date
  }

  /** Returns an array of metrics. */
  get data(): Array<number | null | undefined> {
    return [this.approved, this.rejected, this.submitted, this.pending]
  }

  /** Checks if metrics are defined */
  get valuesDefined(): boolean {
    return !this.data.includes(null) && !this.data.includes(undefined)
  }

  /**
   * Makes call to Jira API with JQL, start and end dates, then sets the response to approved, rejected, submitted and pending.
   * @param {string} start - YYYY-MM-DD or startOfDay()
   * @param {string} end - YYYY-MM-DD or endOfDay()
   */
  abstract fetchData(start: string, end: string): Promise<(number | undefined | null)[] | null>
}

/**
 * Class representing DAA metrics.
 * @extends Metrics
 */
export class AppMetrics extends Metrics {
  readonly type: string = 'app_approvals'

  async fetchData(start: string = 'startOfDay()', end: string = 'endOfDay()'): Promise<(number | undefined | null)[] | null> {
    try {
      this.approved = await queryJira(queryBuilder('DAA', ['summary !~ QA', 'status in (Resolved,Close)', 'resolution = Approved'], 'resolutiondate', start, end))
      this.rejected = await queryJira(queryBuilder('DAA', ['summary !~ QA', 'status in (Resolved,Close)', 'resolution = Denied'], 'resolutiondate', start, end))
      this.submitted = await queryJira(queryBuilder('DAA', ['summary !~ QA'], 'created', start, end))
      this.pending = await queryJira(queryBuilder('DAA', ['summary !~ QA', 'status in (Open,"In Progress",Waiting-For-Info,In-Progress,"Needs Approval","In QA")'], 'created', undefined, end))

      return this.data
    } catch (error) {
      return Promise.reject(null)
    }
  }
}

/**
 * Class representing DAV metrics.
 * @extends Metrics
 */
export class DevMetrics extends Metrics {
  readonly type: string = 'dev_approvals'

  async fetchData(start: string = 'startOfDay()', end: string = 'endOfDay()'): Promise<(number | undefined | null)[] | null> {
    try {
      this.approved = await queryJira(queryBuilder('DAV', ['status in (Done,Approved)'], 'updatedDate', start, end))
      this.rejected = await queryJira(queryBuilder('DAV', ['status in (Denied)'], 'updatedDate', start, end))
      this.submitted = await queryJira(queryBuilder('DAV', [], 'createdDate', start, end))
      this.pending = await queryJira(queryBuilder('DAV', ['status in (Open,Credit,OFAC,"To Do","In Progress")'], 'createdDate', undefined, end))

      return this.data
    } catch (error) {
      return Promise.reject(null)
    }
  }
}

/**
 * Builds JQL for Jira API call, e.g., "project = DAV AND status in (Done,Approved) AND updatedDate >= 2020-06-17 AND updatedDate < endOfDay()"
 * @param {string} project - Jira project
 * @param {array} fields - Jira fields
 * @param {string} sortBy - Jira field to sort by
 * @param {string} start - start date in YYYY-MM-DD format
 * @param {string} end - end date in YYYY-MM-DD format
 */
export const queryBuilder = (project: string, fields?: string[], sortBy?: string, start?: string, end?: string) => {
  let jql = `project = ${project}`

  if (Array.isArray(fields) && fields.length) {
    jql += ` AND ${fields.join(' AND ')}`
  }

  if (start) {
    jql += ` AND ${sortBy} >= ${start}`
  }

  if (end) {
    jql += ` AND ${sortBy} < ${end}`
  }

  return jql
}

/**
 * Makes asynchronous call to Jira API with supplied JQL and returns total as metric.
 * @param {string} query - JQL
 */
export const queryJira = async (query: string): Promise<any> => {
  try {
    const response = await jiraAPI.get(`/search?jql=${query}`)
    return response.data.total
  } catch (error) {
    console.error(error)
    return Promise.reject(null)
  }
}

/**
 * Writes DAA/DAV metrics to SQL DB and logs the result.
 * @param {Metrics} metrics - an instance of the Metrics class
 */
export const writeToDB = async (metrics: Metrics) => {
  try {
    const fields = [metrics.date, ...metrics.data]
    const response = await query(`REPLACE INTO ${metrics.type} (date, approved, rejected, submitted, pending) VALUES (?,?,?,?,?);`, fields)
    console.log('✨ write2DB: ', metrics.date, fields, response)
    return response
  } catch (error) {
    console.error(error)
    return Promise.reject(null)
  }
}
