import mongoose from '../config/DBHelpler'

const Schema = mongoose.Schema

const CommentsSchema = new Schema({
  // 'cid': { type: String},
  cid: { type: String, ref: 'comments' },
  reply_id: { type: String, ref: 'comment_reply' },
  uid: { type: String, ref: 'users' },
  created: { type: Date }
})

CommentsSchema.pre('save', function (next) {
  this.created = new Date()
  next()
})

CommentsSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

CommentsSchema.statics = {
  findByCid: function (id) {
    return this.find({ cid: id })
  },
  getHandsByUid: function (id, page, limit) {
    return this.find({ uid: id })
      .populate({
        path: 'uid',
        select: '_id name'
      })
      .populate({
        path: 'cid',
        select: '_id content'
      })
      .skip(page * limit)
      .limit(limit)
      .sort({ created: -1 })
  }
}

const CommentsHands = mongoose.model('comments_hands', CommentsSchema)

export default CommentsHands
