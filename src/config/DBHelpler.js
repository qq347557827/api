import mongoose from 'mongoose'
import config from './index'

const DB_URL = 'mongodb://admin:123456@119.91.192.232:27017/admin'

mongoose.set('useCreateIndex', true)
// mongoose.set('debug', true)

// 创建连接
// mongoose.connect(config.DB_URL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// 连接成功
mongoose.connection.on('connected', () => {
  console.log(`MongoDB: ${config.DB_NAME}, DB_HOST: ${config.MONGO_HOSTNAME} connection opened!;链接成功............................ `)
})

// 连接异常
mongoose.connection.on('error', (err) => {
  console.log('config.DB_URL:......................... ', config.DB_URL)
  console.log('Mongoose connection error: ' + err)
})

// 断开连接
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose connection disconnected')
})

export default mongoose
