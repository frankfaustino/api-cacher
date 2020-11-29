import { CronJob } from 'cron'
import * as exectimer from 'exectimer'
import { PoolConnection } from 'mariadb'
import * as moment from 'moment'

import {
  AppMetrics,
  DevMetrics,
  Metrics,
  writeToDB
} from './jira'
import db from '../db'
import { slackWebhook } from '.'


/**
 * Function that is called in the update endpoint and during cron job.
 * Establishes DB connection, sets the Metrics date, fetches Jira data and then writes to GCP DB.
 * @param {Moment} startDate
 * @param {Metrics} metrics - instance of Metrics
 */
export const job = async (startDate: moment.Moment, metrics: Metrics): Promise<(number | undefined | null)[] | null> => {
  const start = moment(startDate).format('YYYY-MM-DD')
  const end = moment(startDate).add(1, 'day').format('YYYY-MM-DD')
  let conn: PoolConnection | undefined
  try {
    conn = await db.getConnection()

    metrics.setDate = start
    const response = await metrics.fetchData(start, end)
    console.log('👉 job resp: ', start, response)

    if (metrics.valuesDefined) {
      await writeToDB(metrics)
      return response
    } else {
      throw Error('Failed to fetch JIRA data')
    }
  } catch (error) {
    console.log('❌ job error: ', start, error)
    return null
  } finally {
    if (conn) conn.end()
  }
}

const Tick = exectimer.Tick
export let count = 0

/**
 * Instance of CronJob that calls job() at minute 25 past hour 2, 8, 14, and 20 and then Slacks the results.
 */
const cron = new CronJob('0 25 2,8,14,20 * * *', async () => {
  const start = moment(new Date())
  console.log('🚀 cron job start: ', start.format('LLLL'))
  const tick = new Tick(`cronJob_${count}`)
  tick.start()

  const apps = await job(start, new AppMetrics())
  if (apps) {
    const body = { text: `Loaded DAA metrics for *${start.format('YYYY-MM-DD')}*: *${apps[0]}* app(s) approved / *${apps[1]}* app(s) rejected / *${apps[2]}* new app(s) submitted / *${apps[3]}* total app(s) pending` }
    slackWebhook.post('', body)
  }
  const devs = await job(start, new DevMetrics())
  if (devs) {
    const body = { text: `Loaded DAV metrics for *${start.format('YYYY-MM-DD')}*: *${devs[0]}* dev account(s) approved / *${devs[1]}* dev account(s) rejected / *${devs[2]}* new dev account(s) submitted / *${devs[3]}* total dev account(s) pending` }
    slackWebhook.post('', body)
  }

  tick.stop()
  const result = exectimer.timers[`cronJob_${count}`]
  count++
  console.log('⏳ cron job time: ', result.parse(result.duration()), '\n✋ cron job count: ', count)
})

export default cron
