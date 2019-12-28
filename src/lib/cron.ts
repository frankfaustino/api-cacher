import { refreshConversation, refreshAdmins, refreshTeams, refreshUsers, setUpTables } from '../db/intercom'

const { CronJob } = require('cron')
const exectimer = require('exectimer')


const Tick = exectimer.Tick
let count = 0

// Run cron job every 30 minutes
new CronJob('*/30 * * * *', async () => {
  console.log('🚀 cron job start: ', new Date())
  const tick = new Tick(`cronJob_${count}`)
  tick.start()

  await setUpTables()
  await refreshUsers()
  await refreshTeams()
  await refreshAdmins()
  await refreshConversation()

  tick.stop()
  const result = exectimer.timers[`cronJob_${count}`]
  count++
  console.log('⏳ cron job time: ', result.parse(result.duration()), '\n✋ cron job count: ', count)
}).start()