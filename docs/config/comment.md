#  Comment

The annotate function is similar to the annotate function of Word, you can select a text alignment to comment, as shown in the following figure:

![](../assets/image/comment-en.png)

>PS: This feature is only available in the Pro version (commercial version) and not in the open source version. Pro version preview address: http://pro.aieditor.com.cn
## How to Use

```typescript
new AiEditor({
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
            // When the comment area gets focus
        },

        queryAllComments: () => {
            // Query all comments of the current document and return CommentInfo[] or Promise<CommentInfo[]>
        },

        queryMyComments: () => {
            // Query "My Comments", return CommentInfo[] or Promise<CommentInfo[]>
        },

        queryCommentsByIds: (commentIds) => {
            // Query multiple comments based on multiple document IDs and return CommentInfo[] or Promise<CommentInfo[]>
        },

        onCommentCreate: (comment) => {
            // When a comment is created, returns CommentInfo or Promise<CommentInfo>
        },

        onCommentDeleteConfirm:(comment)=>{
            // When a comment is deleted, a confirmation box pops up and returns boolean or Promise<boolean>;
        },

        onCommentDelete: (commentId) => {
            // When the comment is deleted, returns boolean or Promise<boolean>;
        },

        onCommentUpdate: (commentId, content) => {
            // When the comment is modified, returns a boolean or Promise<boolean>;
        },
    },
})
```

- **enable**: Whether to enable the comment function
- **floatable**: Whether the content of the comment is floating with the position of the comment area
- **containerClassName**: Customize the class name of the comment area, used for custom style
- **currentAccountAvatar**: When `floatable = false`, configure the display avatar
- **currentAccount**: Configure the name of the current user, which is used to display in the comment
- **currentAccountId**: Configure the id of the current user
- **enableWithEditDisable**: Whether to enable the annotation (comment) function in read-only mode, the default is false
- **onCommentActivated**: This callback is triggered when the comment gets the focus
- **onCommentCreate**: Listen for comments to be created. At this time, we should save the comment content to the database and return the complete comment information
- **onCommentDeleteConfirm**: Listen for comments to be deleted, pop up a confirmation box, and return boolean or `Promise<boolean>`
- **onCommentDelete**: Listen for comments to be deleted, and the comments in the database should be deleted synchronously at this time
- **onCommentUpdate**: Listen for comments to be modified
- **queryAllComments**: Query all comments (valid when `floatable: false` is configured)
- **queryMyComments**: Query my comments (valid when `floatable: false` is configured)
- **queryCommentsByIds**: Query all comments based on multiple comment ids (valid when `floatable: true` is configured)


## Sample code

The following example code uses LocalStorage to save the comment content

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


**CommentInfo** Description of the comment information

- id: indicates the comment id, which is globally unique
- pid: the parent id of the comment
- account: The account or nickname of the comment
- avatar: indicates the URL of the user profile picture
- mainColor: background color of the comment text
- createdAt: Comment time
- content: Comment content
