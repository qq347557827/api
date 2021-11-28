import { getValue } from '@/config/RedisConfig'
import config from '../config/index'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

import moment from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import makedir from 'make-dir'

const getJWTPayload = token => {
  if (!token) return
  let tk
  try {
    if (/^Bearer/.test(token)) {
      tk = jwt.verify(token.split(' ')[1], config.JWT_SECRET)
      console.log('tk: ', tk)
      return tk
    } else {
      tk = jwt.verify(token, config.JWT_SECRET)
    }
  } catch (error) {
    console.log('error: ', error)
  }
  return tk
}

const checkCode = async (key, value) => {
  const redisData = await getValue(key)
  if (redisData != null) {
    if (redisData.toLowerCase() === value.toLowerCase()) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

const getStats = (path) => {
  return new Promise((resolve) => {
    // fs.stats(path, (err, stats) => {
    //   if (err) {
    //     resolve(false)
    //   } else {
    //     resolve(stats)
    //   }
    // })
    fs.stat(path, (err, stats) => err ? resolve(false) : resolve(stats))
  })
}

const mkdir = (dir) => {
  return new Promise((resolve) => {
    fs.mkdir(dir, err => err ? resolve(false) : resolve(true))
  })
}

const dirExists = async (dir) => {
  const isExists = await getStats(dir)
  // 如果该路径存在且不是文件，返回 true
  if (isExists && isExists.isDirectory()) {
    return true
  } else if (isExists) {
    // 路径存在，但是是文件，返回 false
    return false
  }
  // 如果该路径不存在
  const tempDir = path.parse(dir).dir
  // 循环遍历，递归判断如果上级目录不存在，则产生上级目录
  const status = await dirExists(tempDir)
  if (status) {
    const result = await mkdir(dir)
    console.log('TCL: dirExists -> result', result)
    return result
  } else {
    return false
  }
}

const rename = (obj, key, newKey) => {
  if (Object.keys(obj).indexOf(key) !== -1) {
    obj[newKey] = obj[key]
    delete obj[key]
  }
  return obj
}

const sortObj = (arr, property) => {
  return arr.sort((m, n) => m[property] - n[property])
}

const sortMenus = (tree) => {
  tree = sortObj(tree, 'sort')
  if (tree.children && tree.children.length > 0) {
    tree.children = sortMenus(tree.children, 'sort')
  }
  if (tree.operations && tree.operations.length > 0) {
    tree.operations = sortMenus(tree.operations, 'sort')
  }
  return tree
}

const getMenuData = (tree, rights, flag) => {
  const arr = []
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    // _id 包含在menus中
    // 结构进行改造，删除opertaions
    if (rights.includes(item._id + '') || flag) {
      if (item.type === 'menu') {
        arr.push({
          _id: item._id,
          path: item.path,
          meta: {
            title: item.title,
            hideInBread: item.hideInBread,
            hideInMenu: item.hideInMenu,
            notCache: item.notCache,
            icon: item.icon
          },
          component: item.component,
          children: getMenuData(item.children, rights)
        })
      } else if (item.type === 'link') {
        arr.push({
          _id: item._id,
          path: item.path,
          meta: {
            title: item.title,
            icon: item.icon,
            href: item.link
          }
        })
      }
    }
  }

  return sortObj(arr, 'sort')
}

const menusGetMenuData = (treeData, menus, flg) => {
  let arr = []
  for (let i = 0; i < treeData.length; i++) {
    const item = treeData[i]
    if (item.type === 'menu') {
      if (item.children && item.children.length > 0) {
        item.children = menusGetMenuData(item.children, menus, flg)
      }
      const id = item._id + ''
      if (flg || menus.includes(id) || (item.children && item.children.length > 0)) {
        arr.push(item)
      }
    } else if (item.type === 'link' || item.type === 'resource') {
      arr.push(item)
    }
  }
  return arr
}

const flatten = (arr) => {
  while (arr.some((item) => Array.isArray(item))) {
    arr = [].concat(...arr)
  }
  return arr
}

const getRights = (tree, menus) => {
  let arr = []
  for (let item of tree) {
    if (item.operations && item.operations.length > 0) {
      for (let op of item.operations) {
        if (menus.includes(op._id + '')) {
          arr.push(op.path)
        }
      }
    } else if (item.children && item.children.length > 0) {
      arr.push(getRights(item.children, menus))
    }
  }
  return flatten(arr)
}

const base64ToImg = async (base) => {
  const test = base.match(/^data:image\/\w+;base64,/g)

  const ext = test[0].substr(11, test[0].length - 19)
  // eslint-disable-next-line camelcase
  const base_64_url = base.replace(/^data:image\/\w+;base64,/, '')
  const dataBuffer = await Buffer.from(base_64_url, 'base64')
  const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`
  await makedir(dir)
  const picname = uuidv4()
  const destPath = `${dir}/${picname}.${ext}`

  await fs.writeFile(destPath, dataBuffer, function (err) {
    console.log('err: ', err)
  })
  return `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
}

const wsSend = async (id, notfiy) => {
  console.log('notfiy: ', notfiy)
  console.log('id: ', id)
  global.ws.send(id, notfiy)
}
export {
  checkCode,
  getJWTPayload,
  dirExists,
  rename,
  getMenuData,
  menusGetMenuData,
  sortMenus,
  flatten,
  getRights,
  base64ToImg,
  wsSend
}
