import Router from 'koa-router'
import contentController from '@/api/ContentController'
import userController from '@/api/UserController'
import adminController from '@/api/AdminController'
import errorController from '@/api/ErrorController'

const router = new Router()

router.prefix('/admin')

// 标签页面
// 获取标签列表
router.get('/get_tags', contentController.getTags)

// 添加标签
router.post('/add_tag', contentController.addTag)

// 删除标签
router.get('/remove_tag', contentController.removeTag)

// 编辑标签
router.post('/edit_tag', contentController.updateTag)

// 用户管理
// 查询所有用户
router.get('/get_user_list', userController.getUsers)

// 删除
router.post('/delete_user', userController.deleteUserById)

// 更新特定用户
router.post('/update_user', userController.updateUserById)

router.post('/update_user_settings', userController.updateUserBatch)

// 添加用户
router.post('/add_user', userController.addUser)

// 校验用户名是否冲突
router.get('/checkname', userController.checkUsername)

// 添加菜单
router.post('/add_menu', adminController.addMenu)

// 获取菜单
router.get('/get_menus', adminController.getMenu)

// 删除菜单
router.post('/delete_menu', adminController.deleteMenu)

// 更新菜单
router.post('/update_menu', adminController.updateMenu)

// 添加角色
router.post('/add_role', adminController.addRole)

// 获取角色
router.get('/get_roles', adminController.getRoles)

// 删除角色
router.post('/delete_role', adminController.deleteRole)

// 更新角色
router.post('/update_role', adminController.updateRole)

// 获取评论
router.get('/get_comments', adminController.getCommentsAll)

// 删除评论
router.post('/delete_comments', adminController.deleteCommentsBatch)

// 批量更新评论
router.post('/update_commentsBatch', adminController.updateCommentsBatch)

// 获取角色列表
router.get('/get_roles_title', adminController.getRoleNames)

// 获取用户 -> 角色 -> 动态菜单信息
router.get('/get_routes', adminController.getRoutes)

// 获取统计数据
router.get('/getstat', adminController.getStats)

router.get('/get_week_data', adminController.getWeekData)

// 获取错误日志
router.get('/getError', errorController.getErrorList)

// 删除错误日志
router.post('/deleteError', errorController.deleteError)

// router.get('/getOperations', adminController.getOperations)

export default router
