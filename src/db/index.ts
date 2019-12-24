import * as mariadb from 'mariadb'

import config from './config'

const { NODE_ENV } = process.env

export default mariadb.createPool((NODE_ENV && config[NODE_ENV]) || 'development')