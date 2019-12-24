import db from '.'


// TO-DO: replace any
export async function query(queries: Array<string>): Promise<any> {
  let conn: any
  try {
    conn = await db.getConnection()
    return Promise.all(queries.map(async queryStr => await conn.query(queryStr)))
  } catch (e) {
    console.log(e)
    return Promise.reject(e)
  } finally {
    if (conn) conn.end()
  }
}

export async function queryDevrelIds() {
  const listOfObjs = await query(['SELECT id FROM persona WHERE is_devrelian=TRUE;'])
  // console.log('queryDevrelIds: ', listOfObjs[0])
  return listOfObjs[0].map(({ id }: any) => id)
}

export async function queryPersona(id: any) {
  const persona = await query([`SELECT * FROM persona WHERE id=${id};`])
  // console.log('queryPersona: ', persona)
  return persona[0][0]
}