import Router from 'koa-router'
import CommentsController from '@/api/CommentsController'

const router = new Router()

router.prefix('/comments')

// 添加评论
router.post('/reply', CommentsController.addComment)

router.post('/revise', CommentsController.reviseComment)

router.post('/accept', CommentsController.acceptComment)

router.post('/sethand', CommentsController.setHand)

router.post('/chatRayle', CommentsController.chatRayle)

router.post('/chatRayleChat', CommentsController.chatRayleChat)

export default router
