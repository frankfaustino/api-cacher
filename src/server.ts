import * as dotenv from 'dotenv'
import * as cors from 'cors'
import * as express from 'express'

import { handleError } from './lib/utils'

dotenv.config({ path: './.env' })

const { PORT } = process.env
const app: express.Application = express()

app.use(cors())
app.use('/api', require('./api'))
app.use(handleError)

// TO-DO: Add job scheduler

app.listen(PORT, () => console.log(`🤖 Server is listening on port ${PORT} in ${app.get('env')} mode`))