# 图片上传配置

## 文件上传配置

- uploadUrl: 上传文件地址
- uploadHeaders: 上传文件 http 头
- uploader: 自定义上传函数

## 服务器响应

```json
{
  "errorCode": 0,
  "data": {
    "src": "http://your-domain.com/image.jpg",
    "alt": "图片 alt"
  }
}
```

## 图片菜单配置

- customMenuInvoke：自定义菜单点击事件