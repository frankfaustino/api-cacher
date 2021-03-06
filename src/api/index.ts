import { Router } from 'express'

import { dbConfig, dbConnection, last, next, update, start, status, stop } from './controllers'

const router: Router = Router()

router.get('/start', start)
router.get('/stop', stop)
router.get('/update', update)
router.get('/status', status)
router.get('/next', next)
router.get('/last', last)
router.get('/dbConfig', dbConfig)
router.get('/dbConnection', dbConnection)

export default router
