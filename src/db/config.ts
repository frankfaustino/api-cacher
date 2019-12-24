const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, LOCAL_PATH, LOCAL_USER } = process.env

const config: { [key: string]: any } = {
  development: {
    user: LOCAL_USER,
    socketPath: LOCAL_PATH,
    database: DB_NAME
  },
  production: {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  }
}

export default config
