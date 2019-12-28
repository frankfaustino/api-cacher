import { Request, Response } from 'express'

import { queryPersona } from '../../db/fns'
import { refreshUsers, refreshTeams, refreshAdmins, refreshConversation, setUpTables, showTables } from '../../db/intercom'


const exectimer = require('exectimer')
const Tick = exectimer.Tick

export const persona = async (_: Request, res: Response) => res.json(await queryPersona('3365251'))

export const tables = async (_: Request, res: Response) => res.json(await setUpTables())

export const getTables = async (_: Request, res: Response) => res.json(await showTables())

export const refreshPersonas = async (_: Request, res: Response) => {
  const tick = new Tick('timer')
  tick.start()
  await refreshUsers()
  await refreshTeams()
  await refreshAdmins()
  tick.stop()
  const result = exectimer.timers.timer
  res.json({
    message: 'Persona table updated',
    duration: result.parse(result.duration())
  })
}

export const refreshConversations = async (_: Request, res: Response) => {
  const tick = new Tick('timer')
  tick.start()
  await refreshConversation()
  tick.stop()
  const result = exectimer.timers.timer
  res.json({
    message: 'Conversation table updated',
    duration: result.parse(result.duration())
  })
}
