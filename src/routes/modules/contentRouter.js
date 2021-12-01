import Router from 'koa-router'
import contentController from '@/api/ContentController'

const router = new Router()

router.prefix('/content')

// 发表新贴
router.post('/addPost', contentController.addPost)

// 更新帖子
router.post('/update_post', contentController.updatePost)

router.post('/updateId', contentController.updatePostByTid)

router.post('/updatePostSettings', contentController.updatePostBatch)

// 删除帖子
router.post('/del_post', contentController.deletePost)

export default router
