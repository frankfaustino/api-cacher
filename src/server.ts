import * as dotenv from 'dotenv'
import * as cp from 'child_process'
import * as cors from 'cors'
import * as express from 'express'

dotenv.config({ path: './.env' })

import { handleError } from './lib/utils'


const { PORT } = process.env
const app: express.Application = express()

app
  .use(cors())
  .use('/api', require('./api'))
  .use(handleError)
  .listen(PORT, () => console.log(`🤖 Server is listening on port ${PORT} in ${app.get('env')} mode`))

const spawn = cp.fork(require.resolve('./lib/cron.ts'))
spawn.on('close', code => console.log(`👋 Child process exited with code ${code}`))
