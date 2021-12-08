import Router from 'koa-router'
import CommentsController from '@/api/CommentsController'

const router = new Router()

router.prefix('/comments')

// 添加评论
router.post('/add_comment', CommentsController.addComment)

router.post('/revise', CommentsController.reviseComment)

router.post('/accept', CommentsController.acceptComment)
// 点赞评论
router.post('/comment_hand', CommentsController.commentHand)

// 点赞回复
router.post('/reply_hand', CommentsController.replyHand)

// 评论回复
router.post('/comment_reply', CommentsController.commentReply)

// 评论下 回复别人的回复
router.post('/reply_reply', CommentsController.replyToReply)

// 删除评论
router.post('/delete_comment', CommentsController.deleteComment)

// 删除回复
router.post('/delete_reply', CommentsController.deleteReply)
export default router
