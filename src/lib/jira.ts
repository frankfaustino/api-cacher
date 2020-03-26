import { jiraAPI } from '.'
import { query } from '../db'

export abstract class Metrics {
  type: string | undefined
  date: string | undefined
  approved: number | undefined | null
  rejected: number | undefined | null
  submitted: number | undefined | null
  pending: number | undefined | null

  public clear(): void {
    this.date = undefined
    this.approved = undefined
    this.rejected = undefined
    this.submitted = undefined
    this.pending = undefined
  }

  set setDate(date: string) {
    this.date = date
  }

  get data(): Array<number | null | undefined> {
    return [this.approved, this.rejected, this.submitted, this.pending]
  }

  get valuesDefined(): boolean {
    return !this.data.includes(null) && !this.data.includes(undefined)
  }

  abstract fetchData(start: string, end: string): Promise<(number | undefined | null)[] | null>
}

export class AppMetrics extends Metrics {
  readonly type: string = 'app_approvals'

  async fetchData(start: string = 'startOfDay()', end: string = 'endOfDay()'): Promise<(number | undefined | null)[] | null> {
    try {
      this.approved = await queryJira(queryBuilder('DAA', ['summary !~ QA', 'status in (Resolved,Close)'], 'resolutiondate', start, end))
      this.rejected = await queryJira(queryBuilder('DAA', ['summary !~ QA', 'status in (Resolved,Close)', 'resolution = Denied'], 'resolutiondate', start, end))
      this.submitted = await queryJira(queryBuilder('DAA', ['summary !~ QA', 'status in (Open,"In Progress",Waiting-For-Info,In-Progress,"Needs Approval","In QA")'], 'created', start, end))
      this.pending = await queryJira(queryBuilder('DAA', ['summary !~ QA', 'status in (Open,"In Progress",Waiting-For-Info,In-Progress,"Needs Approval","In QA")'], 'created', undefined, end))

      return this.data
    } catch (error) {
      return Promise.reject(null)
    }
  }
}

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

export const sanityCheck = async (): Promise<any> => await jiraAPI.get('/myself')

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

export const queryJira = async (query: string): Promise<any> => {
  try {
    const response = await jiraAPI.get(`/search?jql=${query}`)
    return response.data.total
  } catch (error) {
    console.error(error)
    return Promise.reject(null)
  }
}

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
