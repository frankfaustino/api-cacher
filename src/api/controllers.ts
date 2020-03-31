import { Request, Response } from 'express'
import * as moment from 'moment'

import cron from '../lib/cron'
import { count, job } from '../lib/cron'
import config from '../db/config'
import db from '../db'
import {
  AppMetrics,
  DevMetrics,
} from '../lib/jira'

export const start = (_: Request, res: Response) => {
  cron.start()
  res.json({ message: 'cron job started' })
}

export const stop = (_: Request, res: Response) => {
  cron.stop()
  res.json({ message: 'cron job stopped' })
}

export const status = (_: Request, res: Response) => {
  res.json({
    message: `cron job is ${cron.running ? 'running' : 'not running'}`,
    count: `cron job ran ${count} time(s)`
  })
}

export const next = (_: Request, res: Response) => {
  const nextDates = cron.nextDates(5)
  const dates: (string | undefined)[] = []

  if (Array.isArray(nextDates)) {
    nextDates.reduce((p, c) => {
      p.push(moment(c).format('LLLL'))
      return p
    }, dates)
  }

  res.json({ message: 'next 5 cron jobs', dates })
}

export const last = (_: Request, res: Response) => {
  const lastDate = cron.lastDate()
  res.json({ message: lastDate ? `cron job last ran on ${lastDate}` : 'cron job hasn\'t been run yet' })
}

export const dbConfig = (_: Request, res: Response) =>
  res.json({ message: `current environment is set to ${process.env.NODE_ENV}`, config })

export const dbConnection = async (_: Request, res: Response) => {
  try {
    await db.getConnection()
    res.json({ message: 'able to connect to SQL DB' })
  } catch (error) {
    res.json(error)
  }
}

export const update = async ({ query: { start, end } }: Request, res: Response) => {
  const output = {}

  try {
    if (typeof start === 'string' && start.length) {
      const startDate = moment(start)
      const endDate = typeof end === 'string' && end.length ? moment(end) : moment()
      let count = 0

      while (startDate.format('YYYY-MM-DD') <= endDate.format('YYYY-MM-DD')) {
        const apps = await job(startDate, new AppMetrics())
        const devs = await job(startDate, new DevMetrics())
        if (apps && devs) {
          Object.assign(output, {
            [startDate.format('YYYY-MM-DD')]: {
              apps: {
                approved: apps[0],
                rejected: apps[1],
                submitted: apps[2],
                pending: apps[3]
              },
              devs: {
                approved: devs[0],
                rejected: devs[1],
                submitted: devs[2],
                pending: devs[3]
              }
            }
          })
        }
        startDate.add(1, 'days')
        count++
      }

      res.json({ message: `Successfully updated ${count} day(s) of data`, ...output })
    } else {
      throw Error('Please provide a start date in the format YYYY-MM-DD')
    }
  } catch ({ message }) {
    res.status(422).json({ message })
  }
}
