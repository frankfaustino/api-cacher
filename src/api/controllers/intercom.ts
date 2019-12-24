import { Request, Response } from 'express'

import { getAllUsers, getAdmins, getConversationCount } from '../intercom'

export const users = async (_: Request, res: Response) => res.json(await getAllUsers())
export const admins = async (_: Request, res: Response) => res.json(await getAdmins())
export const count = async (_: Request, res: Response) => res.json(await getConversationCount())