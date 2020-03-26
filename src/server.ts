import * as cp from 'child_process'
import * as dotenv from 'dotenv'
import * as express from 'express'

dotenv.config({ path: './.env' })

import router from './api'


const app = express()
app.use(router)
app.listen(process.env.PORT || 8888, () => console.log(`Server listening on port ${process.env.PORT || 8888 }`))

const spawn = cp.fork(require.resolve('./lib/cron'))
spawn.on('close', code => console.log(`👋 Child process exited with code ${code}`))
