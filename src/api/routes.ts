import { Router } from 'express'

import { admins, count, persona, users, refreshConversations, refreshPersonas, getTables, tables, welcome } from './controllers'
import { catchError } from '../lib/utils'

const router: Router = Router()

// Internal routes
router.get('/', catchError(welcome))

// Intercom API routes
router.get('/users', catchError(users))
router.get('/admins', catchError(admins))
router.get('/count', catchError(count))

// DB routes
router.get('/persona', catchError(persona))
router.get('/conversations')
router.get('/show_tables', catchError(getTables))
router.get('/setup_tables', catchError(tables))
router.get('/refresh_personas', catchError(refreshPersonas))
router.get('/refresh_conversations', catchError(refreshConversations))

export default router