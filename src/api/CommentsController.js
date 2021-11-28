import { getJWTPayload, base64ToImg, wsSend } from '../common/Utils'
// import { getJWTPayload } from '../conmon/Utils';
import moment from 'dayjs'
import config from '../config/index'

import Comments from '../model/Comments'
import Post from '../model/Post'
import Users from '../model/User'
import Hands from '../model/CommentsHands'
import Chats from '../model/CommentChat'

import fs from 'fs'
import mkdir from 'make-dir'
import { v4 as uuidv4 } from 'uuid'

const isStatus = async (token) => {
  const obj = getJWTPayload(token)
  const user = await Users.findById(obj._id)
  return user.status === '1'
}

class CommentsController {
  // 新增评论
  async addComment (ctx) {
    const file = ctx.request.files.file
    const body = ctx.request.body
    const commentObj = {}
    commentObj.content = body.content
    commentObj.tid = body.tid
    // eslint-disable-next-line no-unused-vars
    const flg = await isStatus(ctx.header.authorization)

    const obj = await getJWTPayload(ctx.header.authorization)

    // const commentObj = { tid, content, commentImg }

    if (file) {
      const ext = file.name.split('.').pop()
      const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`
      await mkdir(dir)
      const picname = uuidv4()
      const destPath = `${dir}/${picname}.${ext}`
      const render = fs.createReadStream(file.path)
      const upStream = fs.createWriteStream(destPath)
      render.pipe(upStream)
      commentObj.commentImg = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
    }
    const newComment = new Comments(commentObj)

    // const newComment = new Comments({ content: body.content })

    // newComment.content = body.content
    newComment.cuid = obj._id
    const comment = await newComment.save()
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
      data: commentObj
    }
    wsSend(user._id, notfiy)
  }

  async reviseComment (ctx) {
    // const file = ctx.request.files.file
    //
    const body = ctx.request.body
    //
    const comment = await Comments.findById(body.commentId)

    let result = {}

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
        msg: '修改成功',
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
      const fav = post.favs ? post.favs : 0
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
          //     favs: - parseInt(fav)
          //   }
          // })
          await Users.updateOne({ _id: comment.cuid }, {
            $inc: {
              favs: parseInt(fav)
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
  async chatRayle (ctx) {
    const body = ctx.request.body
    // c
    const commentImg = body.commentImg ? await base64ToImg(body.commentImg) : ''
    const obj = await getJWTPayload(ctx.header.authorization)
    body.commentImg = commentImg
    body.chat_id = obj._id
    const chat = await new Chats(body)
    const result = await chat.save()
    await Comments.updateOne({ _id: body.comment_id }, {
      $inc: {
        reply_count: 1
      }
    })

    ctx.body = {
      code: 200,
      data: result
    }
  }

  // 评论回复 再回复
  async chatRayleChat (ctx) {
    const body = ctx.request.body
    const commentImg = body.commentImg ? await base64ToImg(body.commentImg) : ''
    body.commentImg = commentImg
    const obj = await getJWTPayload(ctx.header.authorization)
    body.chat_id = obj._id

    const chat = await new Chats(body)
    const result = await chat.save()
    await Comments.updateOne({ _id: body.comment_id }, {
      $inc: {
        reply_count: 1
      }
    })

    const data = await Chats.getChatOne(result.id)

    ctx.body = {
      code: 200,
      data: data
    }
  }

  // 点赞
  async setHand (ctx) {
    const body = ctx.request.body

    const obj = await getJWTPayload(ctx.header.authorization)
    const handed = body.handed || '0'
    const findHands = await Hands.findOne({ cid: body.cid })
    if (handed === '0' && !findHands) {
      const hands = new Hands(body)
      const data = await hands.save()

      const result = await Comments.updateOne({ _id: body.cid }, {
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
    } else if (body.handed === '1' && findHands && obj._id === findHands.uid) {
      await Hands.deleteOne({ _id: findHands._id })
      const result = await Comments.updateOne({ _id: body.cid }, {
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

      const id = item._id.toJSON()
      const chats = await Chats.getCommentChatList(id)
      if (chats.length > 0) {
        result[i].chats = chats
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

          if (commentHands) {
            if (commentHands.uid === obj._id) {
              item.handed = '1'
            }
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
}
export default new CommentsController()
