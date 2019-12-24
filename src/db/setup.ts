import { query } from './fns'


export async function showTables() {
  const result = await query(['SHOW TABLES;'])
  Array.isArray(result) && result.forEach((table: any) => console.log(table['Tables_in_intercom']))
  return result
}

async function createTable(tableName: string, columns: Array<string>) {
  try {
    const queryList = [`DROP TABLE IF EXISTS ${tableName};`, `CREATE TABLE ${tableName} (${columns}) CHARACTER SET "utf8" ;`, 'SHOW TABLES;']
    const tables = await query(queryList)
    return tables
  } catch (e) {
    console.log(e)
    throw e
  }
}

export async function setUpTables() {
  const tables = await query(['USE intercom;', 'SHOW TABLES;'])
  const keys = Object.keys(tables)

  if (!keys.includes('persona')) {
    const fields = [
      'id VARCHAR(255) PRIMARY KEY',
      'name NVARCHAR(255)',
      'email NVARCHAR(255)',
      'is_team BOOLEAN',
      'is_admin BOOLEAN',
      'is_devrelian BOOLEAN'
    ]
    await createTable('persona', fields)
  }
  if (!keys.includes('persona_conversation')) {
    await createTable('persona_conversation', [
      'id INT AUTO_INCREMENT PRIMARY KEY',
      'user_id VARCHAR(255) NOT NULL',
      'conv_id VARCHAR(255)'
    ])
  }
  if (!keys.includes('conversation')) {
    const fields = [
      'id VARCHAR(255) PRIMARY KEY',
      'name NVARCHAR(255)',
      'open BOOLEAN',
      'created_at DATETIME',
      'updated_at DATETIME',
      'first_response_at DATETIME',
      'is_escalation BOOLEAN',
      'is_appmarket BOOLEAN',
      'is_semi_integration BOOLEAN',
      'is_dev BOOLEAN',
      'subject NVARCHAR(255)',
      'link VARCHAR(255)'
    ]
    await createTable('conversation', fields)
  }
  return 'Finished setting up tables'
}

