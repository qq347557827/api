FROM node:14-alpine

LABEL maintainer=brian@toimc.com

# 创建一个工作目录
WORKDIR /app

COPY . .

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && apk update

RUN apk --no-cache add --virtual builds-deps build-base python2 alpine-sdk 
  # && npm install --no-progress --registry=https://registry.npm.taobao.org 
RUN npm install -g cnpm --no-progress --registry=https://registry.npmmirror.com 
RUN cnpm install node-pre-gyp 
RUN cnpm install --no-progress 
RUN npm run build 
  # && npm rebuild bcrypt --build-from-source \
RUN apk del builds-dep

EXPOSE 3000 3001

VOLUME [ "/app/ public" ]

CMD [ "node", "dist/server.bundle.js" ]
