# 批注（或评论）

批注功能和 Word 的批注评论功能类似，可以选择一段文字对齐进行批注，如下图所示：

![](../../assets/image/comment1.png)

> PS：此功能在 Pro 版本才有，开源版没有这个功能。 Pro 版预览地址：http://pro.aieditor.com.cn

## 使用方法

```typescript
new AiEditorPro({
    element: "#aiEditor",
    comment: {
        enable: true,
        floatable: false,
        containerClassName: "comment-container",

        // currentAccountAvatar: "https://aieditor.com.cn/logo.png",
        currentAccount:"Miachel Yang",
        currentAccountId: "1",
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

        onCommentCreate: (comment) => {
            // 当评论被创建时，，返回 CommentInfo 或者 Promise<CommentInfo>
        },

        onCommentDeleteConfirm:(comment)=>{
            // 当评论被删除时，弹出确认框，返回 boolean 或者  Promise<boolean>;
        },

        onCommentDelete: (commentId) => {
            // 当评论被删除时， 返回 boolean 或者  Promise<boolean>;
        },

        onCommentUpdate: (commentId, content) => {
            // 当评论被修改时，返回 boolean 或者  Promise<boolean>;
        },
    },
})
```

- **enable**: 是否启用评论功能
- **floatable**: 评论的内容，是否是跟评论区域位置浮动的
- **containerClassName**: 自定义评论区域的 class 名称，用于自定义样式
- **currentAccountAvatar**: 在 `floatable = false` 时，配置显示头像
- **currentAccount**: 配置当前用户的名称，用于显示在评论中
- **currentAccountId**: 配置当前用户的id
- **enableWithEditDisable**: 是否在只读模式下，也开启批注（评论）的功能，默认为 false
- **onCommentActivated**: 评论获得焦点时，会触发此回调
- **onCommentCreate**:  监听评论被创建，此时我们应该把评论内容保存到数据库，并返回完整的评论信息
- **onCommentDeleteConfirm**:  监听评论被删除，弹出确认框，返回 boolean 或者  `Promise<boolean>`
- **onCommentDelete**:  监听评论被删除，此时应该同步删除数据库的评论
- **onCommentUpdate**:  监听评论被修改
- **queryAllComments**:  查询所有的评论（当配置 `floatable: false` 是有效）
- **queryMyComments**:  查询 我的评论（当配置 `floatable: false` 是有效）
- **queryCommentsByIds**:  根据多条评论 id，查询所有的评论（当配置 `floatable: true` 是有效）

## 示例代码

以下的示例代码，是使用了 LocalStorage 来保存评论内容

```typescript
const colors = ['#3f3f3f', '#938953', '#548dd4', '#95b3d7',
    '#d99694', '#c3d69b', '#b2a2c7', '#92cddc', '#fac08f'];
new AiEditorPro({
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


        onCommentCreate: (comment) => {
            console.log("onCommentCreate---->", comment)
            comment = {
                ...comment,
                account: "张三",
                // avatar: Math.floor(Math.random() * 10) > 3 ? "https://aieditor.dev/assets/image/logo.png" : undefined,
                mainColor: colors[Math.floor(Math.random() * colors.length)],
                createdAt: "05-26 10:23",
            } as CommentInfo;

            localStorage.setItem("comment-" + comment.id, JSON.stringify(comment));

            const allCommentsString = localStorage.getItem("all-comments");
            const allComments = allCommentsString ? JSON.parse(allCommentsString) : [];

            if (comment.pid) {
                const parentCommentJSON = localStorage.getItem("comment-" + comment.pid);
                if (parentCommentJSON) {
                    const parentComment = JSON.parse(parentCommentJSON);
                    if (parentComment.children) {
                        parentComment.children.unshift(comment)
                    } else {
                        parentComment.children = [comment]
                    }
                    localStorage.setItem("comment-" + comment.pid, JSON.stringify(parentComment));
                }
            } else {
                allComments.push("comment-" + comment.id)
            }


            localStorage.setItem("all-comments", JSON.stringify(allComments));

            // return callback(comment);
            return new Promise((resolve) => {
                resolve(comment)
            })
            // return comment;
        },


        onCommentDeleteConfirm: (comment) => {
            console.log("onCommentDeleteConfirm---->", comment)
            return confirm("确认要删除吗");
        },
        
        
        onCommentDelete: (commentId) => {
            console.log("onCommentDelete---->", commentId)

            const commentInfo = JSON.parse(localStorage.getItem("comment-" + commentId)!);
            if (commentInfo.pid) {
                const parentCommentJSON = localStorage.getItem("comment-" + commentInfo.pid);
                if (parentCommentJSON) {
                    const parentComment = JSON.parse(parentCommentJSON);
                    if (parentComment.children) {
                        parentComment.children = parentComment.children.filter((item: any) => item.id !== commentId)
                        localStorage.setItem("comment-" + commentInfo.pid, JSON.stringify(parentComment));
                    }
                }
            }
            localStorage.removeItem("comment-" + commentId);
            return true;
        },

        onCommentUpdate: (commentId, content) => {
            console.log("onCommentUpdate---->", commentId, content)
            const commentInfo = JSON.parse(localStorage.getItem("comment-" + commentId)!);
            commentInfo.content = content
            localStorage.setItem("comment-" + commentId, JSON.stringify(commentInfo))
            return true
        }
    },
})
```

**CommentInfo** 评论信息描述

- id: comment id, globally unique
- pid: comment parent id
- content: comment content
- account: comment account or nickname
- accountId: account id
- avatar: user avatar URL address
- createdAt: comment time
- mainColor: background color of comment text
- commentFor?: commented content,
- replyAccount?: reply account (who is replying to?),
- replyAccountId?: reply account id (who is replying to?),
- children?: CommentInfo[],


