import * as dotenv from 'dotenv'
import * as cors from 'cors'
import * as express from 'express'

dotenv.config({ path: './.env' })

import { job } from './cron'
import { handleError } from './lib/utils'

const { PORT } = process.env
const app: express.Application = express()

app.use(cors())
app.use('/api', require('./api'))
app.use(handleError)

// TO-DO: Add worker-farm
job.start()

app.listen(PORT, () => console.log(`🤖 Server is listening on port ${PORT} in ${app.get('env')} mode`))