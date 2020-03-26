import { Request, Response } from 'express'
import * as moment from 'moment'

import cron from '../lib/cron'
import { count } from '../lib/cron'

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