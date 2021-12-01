import Router from 'koa-router'
import publicController from '@/api/PublicController'
import contentController from '@/api/ContentController'
import userController from '@/api/UserController'
import commentsController from '@/api/CommentsController'

const router = new Router()

router.prefix('/public')

// 获取图片验证码
router.get('/getCaptcha', publicController.getCaptcha)

// 获取文章列表
router.get('/get_post_list', contentController.getPostList)

// 温馨提醒
router.get('/tips', contentController.getTips)

// 友情链接
router.get('/links', contentController.getLinks)

// 回复周榜
router.get('/topWeek', contentController.getTopWeek)

// 确认修改邮件
router.get('/resetEmail', userController.updateUsername)

// 获取文章详情
router.get('/content_detail', contentController.getPostDetail)

// 获取评论列表
router.get('/comments', commentsController.getComments)

// 获取用户基本信息
router.get('/get_basic_info', userController.getBasicInfo)

// 获取用户最近的发贴记录
router.get('/latestPost', contentController.getPostPublic)

// 获取用户最近的评论记录
router.get('/latestComment', commentsController.getCommentPublic)

// 获取用热门帖子
router.get('/hotPost', publicController.getHotPost)

// 获取用热门评论
router.get('/hotComments', publicController.getHotComments)

// 获取用签到排行
router.get('/hotSignRecord', publicController.getHotSignRecord)

// 通过file对象上传图片
router.post('/upload', contentController.uploadImg)

// 通过base64上传图片
router.post('/updateBase64', contentController.updateBase64)

export default router
