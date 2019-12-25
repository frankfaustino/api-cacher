import axios from 'axios'

const limiter = require('axios-rate-limit')
const exectimer = require('exectimer')

const Tick = exectimer.Tick 

const axiosInstance = axios.create({
  baseURL: 'https://api.intercom.io',
  headers: {
    Authorization: `Bearer ${process.env.INTERCOM_TOKEN}`
  }
})

const intercom = limiter(axiosInstance, { maxRequests: 14, perMilliseconds: 1000 })

export async function getUsers(page: number) {
  return await intercom.get(`/users?page=${page}&per_page=60`)
}

export async function getAllUsers() {
  const tick = new Tick('getAllUsers')
  tick.start()
  const firstPage = await getUsers(1)
  const users = firstPage.data.users || []
  const totalPages = firstPage.data.pages.total_pages
  let pg = 2

  while (pg <= totalPages) {
    const response = await getUsers(pg)
    if (response && Array.isArray(response.data.users)) {
      users.push(...response.data.users)
    }
    pg++
  }
  tick.stop()
  const result = exectimer.timers.getAllUsers
  console.log('getAllUsers time: ' + result.parse(result.duration()), users.length, pg)
  return users
}

export async function getTeams() {
  try {
    const response = await intercom.get('/teams')
    // console.log('getTeams: ', response)
    return response.data.teams
  } catch (e) {
    console.log('🟤 getTeams:', e.message)
    return e
  }
}

export async function getAdmins() {
  try {
    const response = await intercom.get('/admins')
    // console.log(response)
    return response.data.admins
  } catch (e) {
    console.log('🟤 getAdmins:', e.message)
    return e
  }
}

export async function getConversationCount() {
  try {
    const response = await intercom.get('/counts?type=conversation&count=admin')
    return response.data.conversation.admin
  } catch (e) {
    console.log('🟤 getConversationCount:', e.message)
    return e
  }
}

export async function getAdminConversations(adminId: string) {
  try {
    // TO-DO: replace any
    const firstPage: any  = await intercom.get(`/conversations?type=admin&admin_id=${adminId}&order=updated_at&sort=desc&per_page=60`)
    const conversations = firstPage.data.conversations || []
    let nextPage = firstPage.data.pages.next

    while (nextPage) {
      const response: any = await intercom.get(nextPage)
      if (response && Array.isArray(response.data.conversations)) {
        conversations.push(...response.data.conversations)
      }
      nextPage = response.data.pages.next
    }

    return conversations
  } catch (e) {
    console.log('🟤 getAdminConversations:', e.message)
    return e
  }
}

export async function getConversation(conversationId: string) {
  try {
    const response = await intercom.get(`/conversations/${conversationId}`)
    // console.log(response)
    return response.data
  } catch (e) {
    console.log('🟤 getConversation:', e.message, conversationId)
    return e
  }
}
