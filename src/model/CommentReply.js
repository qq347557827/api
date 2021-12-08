import mongoose from '../config/DBHelpler'
import moment from 'dayjs'

const Schema = mongoose.Schema

const CommentReplySchema = new Schema({
  tid: { type: String },
  // 文章id
  comment_id: { type: String, ref: 'comments' },
  // 评论id
  reply_id: { type: String, ref: 'comment_reply' },
  // 回复目标id
  reply_type: { type: String, default: 'comment' },
  // 回复类型 comment 表示回复评论,  reply 表示回复别人的回复
  from_uid: { type: String, ref: 'users' },
  // 回复用户id
  to_uid: { type: String, ref: 'users' },
  // 目标用户id
  content: { type: String },
  commentImg: { type: String },
  created: { type: Date },
  hands: { type: Number, default: 0 },
  // 点赞数
  status: { type: String, default: '0' }
  // 显示状态, 0 正常显示, 1自己删除, 2 违规被系统删除
})

CommentReplySchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

CommentReplySchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error())
  }
})

CommentReplySchema.statics = {
  // 查询评论下的回复
  // eslint-disable-next-line camelcase
  getCommentReplyList (comment_id) {
    console.log('comment_id: ', comment_id)
    return this.find({ comment_id: comment_id, status: { $eq: '0' } })
      .populate({
        path: 'from_uid',
        select: '_id name pic isVip'
      }).populate({
        path: 'to_uid',
        select: '_id name pic isVip'
      }).populate({
        path: 'reply_id',
        select: '_id content status'
      })
  },
  getReplyOne (id) {
    return this.findOne({ _id: id }).populate({
      path: 'from_uid',
      select: '_id name pic isVip'
    }).populate({
      path: 'to_uid',
      select: '_id name pic isVip'

    }).populate({
      path: 'reply_id',
      select: '_id content'
    })
  }
}

const CommentReply = mongoose.model('comment_reply', CommentReplySchema)

export default CommentReply
