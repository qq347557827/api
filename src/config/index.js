import path from 'path'

// const MONGO_USERNAME = process.env.DB_USER || 'test'
// const MONGO_PASSWORD = process.env.DB_PASS || 'imooc123'
// const MONGO_HOSTNAME = process.env.DB_HOST || 'dev.toimc.com'
// const MONGO_PORT = process.env.DB_PORT || '43130'
// const DB_NAME = process.env.DB_NAME || 'testdb'

const MONGO_USERNAME = process.env.DB_USER || 'admin'
const MONGO_PASSWORD = process.env.DB_PASS || '123456'
const MONGO_HOSTNAME = process.env.DB_HOST || '119.91.192.232'
const MONGO_PORT = process.env.DB_PORT || '27017'
const DB_NAME = process.env.DB_NAME || 'admin'

const DB_URL = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${DB_NAME}`

console.log('DB_URL', DB_URL)

const REDIS = {
  host: process.env.REDIS_HOST || '119.91.192.232',
  port: process.env.REDIS_PORT || 15001,
  password: process.env.REDIS_PASS || '123456'
}

const JWT_SECRET = '&Vi%33pG2mD51xMo%OUOTo$ZWOa3TYt328tcjXtW9&hn%AOb9quwaZaRMf#f&44c'

const baseUrl = process.env.NODE_ENV === 'production' ? 'http://front.dev.toimc.com:22500' : 'http://localhost:8080'
// baseUrl是修改密码,发送给用户跳转的链接
const uploadPath = process.env.NODE_ENV === 'production' ? '/app/public' : path.join(path.resolve(__dirname), '../../public')

const adminEmail = ['ok@qq.com']

const publicPath = [/^\/public/, /^\/login/, /^\/content/, /^\/user/, /^\/comments/]

const isDevMode = process.env.NODE_ENV !== 'production'

const port = 3000
const wsPort = 3001

export default {
  DB_NAME,
  MONGO_HOSTNAME,
  DB_URL,
  REDIS,
  JWT_SECRET,
  baseUrl,
  uploadPath,
  adminEmail,
  publicPath,
  isDevMode,
  port,
  wsPort
}
