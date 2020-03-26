import axios from 'axios'

export const jiraAPI = axios.create({
  baseURL: process.env.JIRA_URL,
  headers: {
    Authorization: `Basic ${process.env.JIRA_TOKEN}`
  }
})

export const slackWebhook = axios.create({ baseURL: process.env.SLACK_URL })

export * from './jira'