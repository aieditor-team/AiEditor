# 批注（或评论）

批注功能和 Word 的批注评论功能类似，可以选择一段文字对齐进行批注，如下图所示：

![](../../assets/image/comment1.png)

> PS：此功能在 Pro 版本才有，开源版没有这个功能。 Pro 版预览地址：http://pro.aieditor.com.cn

## 使用方法

```typescript
new AiEditor({
    element: "#aiEditor",
    comment: {
        enable: true,
        floatable: false,
        enableWithEditDisable: true,
        onCommentActivated: (commentIds) => {
            // 当评论区域获得焦点
        },

        queryAllComments: () => {
            // 查询当前文档的所有评论，返回 CommentInfo[] 或者 Promise<CommentInfo[]>
        },

        queryMyComments: () => {
            // 查询 “我的评论”，返回 CommentInfo[] 或者 Promise<CommentInfo[]>
        },

        queryCommentsByIds: (commentIds) => {
            // 根据多个文档id，查询多条评论，返回 CommentInfo[] 或者 Promise<CommentInfo[]>
        },


        onCommentCreate: (commentId, content, commentPid) => {
            // 当评论被创建时，，返回 CommentInfo 或者 Promise<CommentInfo>
        },

        onCommentDelete: (commentId) => {
            // 当评论被删除时， 返回 boolean 或者  Promise<boolean>;
        },
    },
})
```

- **enable**: 是否启用评论功能
- **floatable**: 评论的内容，是否是跟评论区域位置浮动的
- **enableWithEditDisable**: 是否在只读模式下，也开启批注（评论）的功能，默认为 false
- **onCommentActivated**: 监听评论被创建，此时我们应该把评论内容保存到数据库，并返回完整的评论信息
- **onCommentCreate**:  监听评论被创建，此时我们应该把评论内容保存到数据库，并返回完整的评论信息
- **onCommentDelete**:  监听评论被删除，此时应该同步删除数据库的评论
- **queryAllComments**:  查询所有的评论（当配置 `floatable: false` 是有效）
- **queryMyComments**:  查询 我的评论（当配置 `floatable: false` 是有效）
- **queryCommentsByIds**:  根据多条评论 id，查询所有的评论（当配置 `floatable: true` 是有效）

## 示例代码

以下的示例代码，是使用了 LocalStorage 来保存评论内容

```typescript
const colors = ['#3f3f3f', '#938953', '#548dd4', '#95b3d7',
    '#d99694', '#c3d69b', '#b2a2c7', '#92cddc', '#fac08f'];
new AiEditor({
    element: "#aiEditor",
    comment: {
        enable: true,
        floatable: false,
        enableWithEditDisable: true,
        onCommentActivated: (_commentId) => {
            // console.log("onCommentActivated---->", commentId)
        },

        queryAllComments: () => {
            const allCommentsString = localStorage.getItem("all-comments");
            const allCommentIds = allCommentsString ? JSON.parse(allCommentsString) : [];
            const allComments = [] as any[];
            allCommentIds.forEach((commentId: any) => {
                const contentJSON = localStorage.getItem(commentId);
                if (contentJSON) allComments.push(JSON.parse(contentJSON));
            })
            return allComments;
        },

        queryCommentsByIds: (commentIds) => {
            const allComments = [] as any[];
            if (commentIds) commentIds.forEach((commentId: any) => {
                const contentJSON = localStorage.getItem("comment-" + commentId);
                if (contentJSON) allComments.push(JSON.parse(contentJSON));
            })
            return allComments;
        },


        onCommentCreate: (commentId, content, commentPid) => {
            const comment = {
                id: commentId,
                pid: commentPid,
                account: "张三",
                avatar: Math.floor(Math.random() * 10) > 3 ? "https://aieditor.dev/assets/image/logo.png" : undefined,
                mainColor: colors[Math.floor(Math.random() * colors.length)],
                createdAt: "2024-05-26 10:23:56",
                content
            } as CommentInfo;

            localStorage.setItem("comment-" + commentId, JSON.stringify(comment));

            const allCommentsString = localStorage.getItem("all-comments");
            const allComments = allCommentsString ? JSON.parse(allCommentsString) : [];

            if (commentPid) {
                const parentCommentJSON = localStorage.getItem("comment-" + commentPid);
                if (parentCommentJSON) {
                    const parentComment = JSON.parse(parentCommentJSON);
                    if (parentComment.children) {
                        parentComment.children.unshift(comment)
                    } else {
                        parentComment.children = [comment]
                    }
                    localStorage.setItem("comment-" + commentPid, JSON.stringify(parentComment));
                }
            } else {
                allComments.push("comment-" + commentId)
            }


            localStorage.setItem("all-comments", JSON.stringify(allComments));

            return new Promise((resolve) => {
                resolve(comment)
            })
        },

        onCommentDelete: (commentId) => {
            localStorage.removeItem("comment-" + commentId);
            return true;
        },
    },
})
```

**CommentInfo** 评论信息描述

- id: 评论的 id，全局唯一
- pid: 评论的 父级 id
- account: 评论的账户或昵称
- avatar: 用户的头像 URL 地址
- mainColor: 评论的文字的背景颜色
- createdAt: 评论时间
- content: 评论内容
