import { devrelians, formatDate } from '../lib'
import {
  getAllUsers,
  getAdmins,
  getTeams,
  getConversationCount,
  getAdminConversations,
  getConversation
} from '../api/intercom'
import { query, queryDevrelIds, queryPersona } from './fns'

/**
 * Persona Table functions that fetches data from Intercom's API and updates SQL DB
 * refreshUsers, refreshTeams, refreshAdmins
 */
export async function refreshUsers() {
  try {
    const listOfUsers = await getAllUsers()

    listOfUsers.map(async ({ id, name, email }: any) => {
      const isDevrelian = devrelians.includes(id) ? 1 : 0
      console.log('refreshUsers: ', id, name, email)
      const fields = `'${id}', '${name}', '${email}', 0, 0, ${isDevrelian}`
      await query([
        `REPLACE INTO persona (id, name, email, is_team, is_admin, is_devrelian) VALUES (${fields});`,
        'COMMIT;'
      ])
    })
    return
  } catch (e) {
    console.log(e)
    return e
  }
}

export async function refreshTeams() {
  try {
    const listOfTeams = await getTeams()

    listOfTeams.map(async ({ id, name }: any) => {
      console.log('refreshTeams: ', id, name)
      const fields = `'${id}', '${name}', NULL, 0, 0, 1`
      await query([
        `REPLACE INTO persona (id, name, email, is_team, is_admin, is_devrelian) VALUES (${fields});`,
        'COMMIT;'
      ])
    })
    return
  } catch (e) {
    console.log(e)
  }
}

export async function refreshAdmins() {
  try {
    const listOfAdmins = await getAdmins()

    listOfAdmins.map(async ({ id, name, email }: any) => {
      const isDevrelian = devrelians.includes(id) ? 1 : 0
      console.log('refreshAdmins: ', id, name, email)
      const fields = `'${id}', '${name}', '${email}', 0, 1, ${isDevrelian}`
      await query([
        `REPLACE INTO persona (id, name, email, is_team, is_admin, is_devrelian) VALUES (${fields});`,
        'COMMIT;'
      ])
    })
    return
  } catch (e) {
    console.log(e)
  }
}

/**
 * Conversation Table
 *
 */
export async function getUsersNeedingRefresh(): Promise<Array<string>> {
  try {
    const listOfUsers = await getConversationCount()
    const listOfIds = await queryDevrelIds()
    const usersNeedingRefresh: Array<string> = []

    listOfUsers.map(({ id }: any) => {
      if (listOfIds.includes(id)) {
        // TO-DO: implement logic which cross-checks persona_conversation
        // const userCurrentCount = open + closed
        // const userCachedCount = countConversations(id) //SELECT COUNT(*) from persona_conversation WHERE user_id='%s'
        // const userOpenCount = countOpenConversations(id)
        // if (userCount != userCachedCount || open != userOpenCount) {
        //   usersNeedingRefresh.push(id)
        // }
        usersNeedingRefresh.push(id)
      }
    })

    return usersNeedingRefresh
  } catch (e) {
    console.log(e)
    return e
  }
}

export async function getConversations() {
  try {
    const listOfUsers = await getUsersNeedingRefresh()
    const listOfConversations = listOfUsers.map(async id => {
      console.log(`getConversations: ${id}`)
      return await getAdminConversations(id)
    })
    const list = Promise.all(listOfConversations)
    console.log('getConversations: finished fetching conversations')
    return (await list).reduce((acc, cur) => acc.concat(cur))
  } catch (e) {
    console.log(e)
    return e
  }
}

async function wasAssignedToTeam(name: string, parts: any) {
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].part_type === 'assignment') {
      const persona = await queryPersona(parts[i].assigned_to.id)
      if (persona && typeof persona.name === 'string' && persona.name.indexOf(name) > -1) {
        return true
      }
    }
  }
  return false
}

export async function getConversationDetails() {
  try {
    const list = await getConversations()
    console.log('getConversationDetails: finished fetching conversations')
    const output = Promise.all(list.map(async ({ id }: any) => await getConversation(id)))
    console.log('getConversationDetails: finished fetching details')
    return output
  } catch (e) {
    console.log(e)
    return e
  }
}

function getFirstResponseTime(parts: any) {
  let firstResponseTime = 'NULL'

  parts.forEach(({ author, created_at, part_type }: any) => {
    if (part_type === 'comment' && author.type === 'admin') {
      firstResponseTime = formatDate(created_at)
    }
  })

  return firstResponseTime
}

export async function refreshCacheWithConversations() {
  const fields = [
    'id',
    'name',
    'open',
    'created_at',
    'updated_at',
    'first_response_at',
    'is_escalation',
    'is_appmarket',
    'is_semi_integration',
    'is_dev',
    'subject',
    'link'
  ]
  try {
    const listOfConvs = await getConversationDetails()
    console.log('✨refreshCacheWithConversations start')

    const output = listOfConvs.map(async (conv: any) => {
      if (conv) {
        const {
          assignee,
          conversation_message,
          conversation_parts,
          created_at,
          id,
          open,
          tags,
          updated_at
        } = conv
        console.log('✨refreshCacheWithConversations', id)
        const tagsList = (tags && tags.tags) || []
        const partsList = (conversation_parts && conversation_parts.conversation_parts) || []
        const assigneeId = (assignee && assignee.id) || ''
        const { name } = await queryPersona(assigneeId)
        const escalation = (await wasAssignedToTeam('Escalations', partsList)) || tagsList.includes('escalations')
        const isAppMarket = await wasAssignedToTeam('appmarketbusiness', partsList)
        const isSemiInt = await wasAssignedToTeam('Semi Integrations', partsList)
        const isDev = await wasAssignedToTeam('dev@clover.com', partsList)
        const firstResponse = getFirstResponseTime(partsList)
        const subject = conversation_message.subject
          .replace(/<\/?p>/g, '')
          .replace(/\"/g, "'")
        const values = [
          id,
          `'${name}'`,
          open,
          formatDate(created_at),
          formatDate(updated_at),
          firstResponse,
          escalation,
          isAppMarket,
          isSemiInt,
          isDev,
          `"${subject}"`,
          `'https://app.intercom.io/a/apps/ql15elzy/inbox/inbox/${assigneeId}/conversations/${id}'`
        ]

        return await query([
          `REPLACE INTO conversation (${fields.join(',')}) VALUES (${values.join(',')})`,
          `REPLACE INTO persona_conversation (user_id, conv_id) VALUES (${assigneeId}, ${id})`,
          'COMMIT;'
        ])
      }
    })

    console.log('💥', 'reached end of refreshCacheWithConversations')
    return Promise.all(output)
  } catch (e) {
    console.log(e)
    return e
  }
}
