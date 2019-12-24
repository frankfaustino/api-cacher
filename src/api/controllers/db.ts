import { Request, Response } from 'express'

import { queryPersona } from '../../db/fns'
import { refreshUsers, refreshTeams, refreshAdmins, refreshCacheWithConversations } from '../../db/intercom'
import { setUpTables, showTables } from '../../db/setup'


export const persona = async (_: Request, res: Response) => res.json(await queryPersona('3365251'))

export const tables = async (_: Request, res: Response) => res.json(await setUpTables())

export const getTables = async (_: Request, res: Response) => res.json(await showTables())

export const refreshPersonas = async (_: Request, res: Response) => {
  await refreshUsers()
  await refreshTeams()
  await refreshAdmins()
  res.json('Personas Refreshed')
}

export const refreshConversations = async (_: Request, res: Response) => {
  await refreshCacheWithConversations()
  res.json('Conversations refreshed')
}
