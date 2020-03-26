import * as mariadb from 'mariadb'
import { PoolConnection } from 'mariadb'

import config from './config'

const { NODE_ENV } = process.env

const db = mariadb.createPool((NODE_ENV && config[NODE_ENV]) || config['development'])

export async function query(query: string, params: Array<string | number | null | undefined>): Promise<any> {
  let conn: PoolConnection | undefined
  try {
    conn = await db.getConnection()
    if (conn && 'query' in conn) {
      return conn.query(query, params)
    }
  } catch (e) {
    console.log(e)
    return Promise.reject(e)
  } finally {
    if (conn) conn.end()
  }
}

export default db
