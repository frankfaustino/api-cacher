import * as cp from 'child_process'
import * as dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const spawn = cp.fork(require.resolve('./lib/cron'))
spawn.on('close', code => console.log(`👋 Child process exited with code ${code}`))
