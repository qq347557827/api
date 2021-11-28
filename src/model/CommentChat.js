import mongoose from '../config/DBHelpler'
import moment from 'dayjs'

const Schema = mongoose.Schema

const CommentChatSchema = new Schema({
  tid: { type: String }, // 文章id
  replied_id: { type: String, ref: 'comment_chat' },
  comment_id: { type: String }, // 评论id
  cuid: { type: String, ref: 'users' }, // 被回复人id
  // uid: { type: String, ref: 'users' },
  chat_id: { type: String, ref: 'users' }, // 回复人id
  content: { type: String },
  commentImg: { type: String },
  created: { type: Date }
})

CommentChatSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

CommentChatSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error())
  }
})

CommentChatSchema.statics = {
  // eslint-disable-next-line camelcase
  getCommentChatList (comment_id) {
    return this.find({ comment_id: comment_id }).populate({
      path: 'cuid',
      select: '_id name pic isVip'
    }).populate({
      path: 'chat_id',
      select: '_id name pic isVip'
    }).populate({
      path: 'replied_id',
      select: '_id content'
    })
  },
  getChatOne (id) {
    return this.findOne({ _id: id }).populate({
      path: 'cuid',
      select: '_id name pic isVip'
    }).populate({
      path: 'chat_id',
      select: '_id name pic isVip'
    }).populate({
      path: 'replied_id',
      select: '_id content'
    })
  }
}

const CommentChats = mongoose.model('comment_chat', CommentChatSchema)

export default CommentChats
