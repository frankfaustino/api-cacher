import { refreshConversation, refreshAdmins, refreshTeams, refreshUsers } from './db/intercom'

const { CronJob } = require('cron')
const exectimer = require('exectimer')


const Tick = exectimer.Tick
let count = 0

// Run cron job every 30 minutes
const job = new CronJob('*/30 * * * *', async function() {
  console.log('cron job start: ', new Date())
  const tick = new Tick('cronJob')
  tick.start()

  await refreshUsers()
  await refreshTeams()
  await refreshAdmins()
  await refreshConversation()

  tick.stop()
  const result = exectimer.timers.cronJob
  count++
  console.log('cron job time: ', result.parse(result.duration()), '\ncron job count: ', count)
})

export { job }