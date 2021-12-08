import { getJWTPayload, base64ToImg, wsSend } from '../common/Utils'
// import { getJWTPayload } from '../conmon/Utils';
import moment from 'dayjs'
import config from '../config/index'

import Comments from '../model/Comments'
import Post from '../model/Post'
import Users from '../model/User'
import Hands from '../model/CommentsHands'
import Reply from '../model/CommentReply'

import fs from 'fs'
import mkdir from 'make-dir'
import { v4 as uuidv4 } from 'uuid'

// 是否被禁言判断
const isStatus = async (token) => {
  const obj = getJWTPayload(token)
  const user = await Users.findById(obj._id)
  return user.status === '1'
}

class CommentsController {
  // 新增评论
  async addComment (ctx) {
    // eslint-disable-next-line no-unused-vars
    let flg = await isStatus(ctx.header.authorization)
    // 判断有没有被禁言
    if (!flg) {
      const obj = await getJWTPayload(ctx.header.authorization)
      const body = ctx.request.body
      const commentObj = {
        content: body.content,
        tid: body.tid,
        cuid: obj._id
      }
      // const commentObj = { tid, content, commentImg }
      if (ctx.request.files && ctx.request.files.file) {
        const file = ctx.request.files.file
        const ext = file.name.split('.').pop()
        const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`
        await mkdir(dir)
        const picname = uuidv4()
        const destPath = `${dir}/${picname}.${ext}`
        const render = fs.createReadStream(file.path)
        const upStream = fs.createWriteStream(destPath)
        render.pipe(upStream)
        commentObj.commentImg = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
      } else if (body.commentImg) {
        commentObj.commentImg = await base64ToImg(body.commentImg)
      }

      const newComment = new Comments(commentObj)

      // const newComment = new Comments({ content: body.content })

      // newComment.content = body.content
      const result = await newComment.save()
      await Post.updateOne({ _id: body.tid }, {
        $inc: {
          answer: +1
        }
      })
      const findPost = await Post.findById({ _id: body.tid })
      await Users.updateOne({ _id: findPost.uid }, {
        $inc: {
          unread_num: 1
        }
      })
      const user = await Users.findById({ _id: obj._id })

      const notfiy = {
        title: '文章评论',
        unread_num: user.unread_num,
        message: `${user.name}评论了您的文章${findPost.title}`
      }

      ctx.body = {
        code: 200,
        msg: '评论成功',
        data: result
      }
      wsSend(user._id, notfiy)
    }
  }

  async reviseComment (ctx) {
    // const file = ctx.request.files.file
    //
    const body = ctx.request.body

    const comment = await Comments.findById(body.commentId)

    let result

    const obj = await getJWTPayload(ctx.header.authorization)
    if (obj._id === comment.cuid) {
      if (body.content !== comment.content) {
        result = await Comments.updateOne({ _id: body.commentId }, {
          content: body.content
        })
      }
      if (body.commentImg && body.commentImg !== comment.commentImg) {
        const imgPath = await base64ToImg(body.commentImg)
        result = await Comments.updateOne({ _id: body.commentId }, {

          commentImg: imgPath
        })
      } else if (!body.commentImg && body.commentImg !== comment.commentImg) {
        result = await Comments.updateOne({ _id: body.commentId }, {

          commentImg: ''
        })
      }

      const data = await Comments.findById(body.commentId)
      ctx.body = {
        code: 200,
        msg: result,
        data
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '修改人和创建人不符合'
      }
    }

    /**
    if (obj._id === comment.cuid) {

      let commentImg
      if (file) {
        const ext = file.name.split('.').pop()
        const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`
        await mkdir(dir)
        const picname = uuidv4()
        const destPath = `${dir}/${picname}.${ext}`
        const render = fs.createReadStream(file.path)
        const upStream = fs.createWriteStream(destPath)
        render.pipe(upStream)
        commentImg = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
        await Comments.updateOne({ _id: body.commentId }, {
          commentImg: commentImg
        })
      } else if (body.commentImg === '') {
        await Comments.updateOne({ _id: body.commentId }, {
          commentImg: ''
        })
      }

      await Comments.updateOne({ _id: body.commentId }, {
        content: body.content
      })

      ctx.body = {
        code: 200,
        data: {
          content: body.content,
          commentImg
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '修改人和创建人不符合'
      }
    }
    */
  }

  // 采纳评论
  async acceptComment (ctx) {
    const body = ctx.request.body
    const bodyTid = body.tid._id

    const obj = await getJWTPayload(ctx.header.authorization)
    const comment = await Comments.findById(body.id)
    const post = await Post.findById(bodyTid)
    if (post.uid === obj._id) {
      const integral = post.integral ? post.integral : 0
      if (comment.tid === bodyTid && comment.isBest !== '1' && post.isEnd !== '1') {
        await Comments.updateOne({ _id: body.id }, {
          $set: {
            isBest: '1'
          }
        })
        await Post.updateOne({ _id: bodyTid }, {
          $set: {
            isEnd: '1'
          }
        })
        if (comment.cuid !== post.uid) {
          // await Users.updateOne({ _id: post.uid }, {
          //   $inc: {
          //     integrals: - parseInt(integral)
          //   }
          // })
          await Users.updateOne({ _id: comment.cuid }, {
            $inc: {
              integral: parseInt(integral)
            }
          })
        }

        ctx.body = {
          code: 200
        }
      } else {
        ctx.body = {
          code: 501,
          msg: '文章和对应评论不一致'
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '只有文章作者才能采纳'
      }
    }
  }

  // 评论回复
  async commentReply (ctx) {
    const body = ctx.request.body
    const obj = await getJWTPayload(ctx.header.authorization)
    if (body.from_uid === obj._id) {
      const commentImg = body.commentImg ? await base64ToImg(body.commentImg) : ''
      body.commentImg = commentImg
      const reply = new Reply(body)
      const result = await reply.save()
      await Comments.updateOne({ _id: body.comment_id }, {
        $inc: {
          reply_count: 1
        }
      })
      // Post.updateOne({ _id: body.tid }, {
      //   $inc: {
      //     answer: 1
      //   }
      // })
      await Post.updateOne({ _id: body.tid }, {
        $inc: {
          answer: +1
        }
      })
      const data = await Reply.getReplyOne(result._id)
      ctx.body = {
        code: 200,
        data
      }
    }
  }

  // 评论回复 再回复
  async replyToReply (ctx) {
    const body = ctx.request.body
    const obj = await getJWTPayload(ctx.header.authorization)
    if (body.from_uid === obj._id) {
      const commentImg = body.commentImg ? await base64ToImg(body.commentImg) : ''
      body.commentImg = commentImg
      const reply = new Reply(body)
      const result = await reply.save()
      await Comments.updateOne({ _id: body.comment_id }, {
        $inc: {
          reply_count: 1
        }
      })

      // const data = await Reply.getChatOne(result.id)
      ctx.body = {
        code: 200,
        data: result
      }
    }
  }

  // 点赞
  async commentHand (ctx) {
    const body = ctx.request.body

    const obj = await getJWTPayload(ctx.header.authorization)
    const handed = body.handed || '1'
    const findHand = await Hands.findOne({ cid: body._id, uid: obj._id })
    if (handed === '1' && !findHand) {
      const hands = new Hands({ cid: body._id, uid: obj._id })
      const data = await hands.save()
      const result = await Comments.updateOne({ _id: body._id }, {
        $inc: {
          hands: 1
        }
      })
      if (result.ok === 1) {
        ctx.body = {
          code: 200,
          data: data,
          msg: '点赞成功'
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '点赞失败'
        }
      }
    } else if (body.handed === '0' && findHand) {
      await Hands.deleteOne({ _id: findHand._id })
      const result = await Comments.updateOne({ _id: body._id }, {
        $inc: {
          hands: -1
        }
      })
      if (result.ok === 1) {
        ctx.body = {
          code: 200,
          msg: '取消点赞成功'
        }
      }
    }
  }

  async replyHand (ctx) {
    const body = ctx.request.body

    const obj = await getJWTPayload(ctx.header.authorization)
    const handed = body.handed || '1'
    const findHand = await Hands.findOne({ reply_id: body._id, uid: obj._id })
    if (handed === '1' && !findHand) {
      const hands = new Hands({ reply_id: body._id, uid: obj._id })
      const data = await hands.save()
      const result = await Reply.updateOne({ _id: body._id }, {
        $inc: {
          hands: 1
        }
      })
      if (result.ok === 1) {
        ctx.body = {
          code: 200,
          data: data,
          msg: '点赞成功'
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '点赞失败'
        }
      }
    } else if (body.handed === '0' && findHand) {
      await Hands.deleteOne({ _id: findHand._id })
      const result = await Reply.updateOne({ _id: body._id }, {
        $inc: {
          hands: -1
        }
      })
      if (result.ok === 1) {
        ctx.body = {
          code: 200,
          msg: '取消点赞成功'
        }
      }
    }
  }

  // 获取评论
  async getComments (ctx) {
    const params = ctx.query
    const obj = await getJWTPayload(ctx.headers.authorization)
    const tid = params.tid
    const page = params.page ? params.page - 1 : 0
    const limit = params.limit ? parseInt(params.limit) : 10
    if (!tid) {
      ctx.body = {
        code: 500,
        msg: '文章标题为空'
      }
      return
    }
    let result = await Comments.getCommentsList(tid, page, limit)
    const total = await Comments.queryCount(tid)

    result = result.map(item => item.toJSON())
    for (let i = 0; i < result.length; i++) {
      let item = result[i]
      // 这是判断评论已被删除,而评论下面没有回复, 就删除这条不显示
      // 如果评论下面有数据,就把评论信息改为删除信息
      if ((item.status === '1' || item.status === '2') && item.reply_count < 1) {
        delete result[i]
      } else if (item.status === '1') {
        item.content = '该评论已被用户删除'
        item.commentImg = ''
      } else if (item.status === '2') {
        item.content = '该评论违规被系统删除'
        item.commentImg = ''
      }
      const id = item._id.toJSON()
      let reply = await Reply.getCommentReplyList(id)
      if (reply.length > 0) {
        reply = reply.map(item => item.toJSON())
        if (obj) {
          for (let k = 0; k < reply.length; k++) {
            const RyItem = reply[k]
            const Rid = RyItem._id.toJSON()
            RyItem.handed = '0'
            const replyHand = await Hands.findOne({ reply_id: Rid, uid: obj._id })

            if (replyHand) {
              if (replyHand.uid === obj._id) {
                reply[k].handed = '1'
              }
            }
          }
        }
        item.reply = reply
      }
    }

    if (ctx.headers.authorization) {
      const obj = await getJWTPayload(ctx.headers.authorization)
      if (typeof obj._id !== 'undefined') {
        // result = result.map(item => item.toJSON())
        for (let i = 0; i < result.length; i++) {
          let item = result[i]
          item.handed = '0'
          const commentHands = await Hands.findOne({ cid: item._id, uid: obj._id })

          if (commentHands && commentHands.uid === obj._id) {
            item.handed = '1'
          }
        }
      }
    }

    await Post.updateOne({ _id: tid }, {
      $inc: {
        reads: 1
      }
    })

    ctx.body = {
      code: 200,
      data: result,
      total,
      msg: '查詢成功'
    }
  }

  // 获取用户最近的评论记录
  async getCommentPublic (ctx) {
    const params = ctx.query
    const result = await Comments.getCommetsPublic(params.uid, params.page, parseInt(params.limit))
    if (result.length > 0) {
      ctx.body = {
        code: 200,
        data: result,
        msg: '查询最近的评论记录成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '查询评论记录失败！'
      }
    }
  }

  // 删除评论
  async deleteComment (ctx) {
    const { body } = ctx.request
    const { status } = body
    let result
    if (status === '1') {
      const commentCuid = await Comments.findOne({ _id: body._id }, { cuid: 1 })
      if (ctx._id === commentCuid.cuid && ctx._id === body.cuid._id) {
        result = await Comments.updateOne({ _id: body._id }, { status: '1' })
      }
    } else if (status === '2') {
      const user = await Users.findOne({ _id: ctx._id }, { roles: 1 })
      const roles = ['admin', 'super_admin']
      let flg
      for (let i = 0; i < user.roles.length; i++) {
        const role = user.roles[i]
        roles.includes(role) && (flg = true)
      }
      if (flg) {
        result = await Comments.updateOne({ _id: body._id }, { status: '2' })
      }
    }
    ctx.body = {
      code: 200,
      body: result
    }
  }

  // 删除回复
  async deleteReply (ctx) {
    const { body } = ctx.request
    const { status } = body
    let result
    if (status === '1') {
      const reply = await Reply.findOne({ _id: body._id }, { from_uid: 1 })
      if (ctx._id === reply.from_uid && ctx._id === body.cuid._id) {
        result = await Reply.updateOne({ _id: body._id }, { status: '1' })
      }
    } else if (status === '2') {
      const user = await Users.findOne({ _id: ctx._id }, { roles: 1 })
      const roles = ['admin', 'super_admin']
      let flg
      for (let i = 0; i < user.roles.length; i++) {
        const role = user.roles[i]
        roles.includes(role) && (flg = true)
      }
      if (flg) {
        result = await Reply.updateOne({ _id: body._id }, { status: '2' })
      }
    }
    ctx.body = {
      code: 200,
      body: result
    }
  }
}
export default new CommentsController()
