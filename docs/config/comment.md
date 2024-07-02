#  Comment

The annotate function is similar to the annotate function of Word, you can select a text alignment to comment, as shown in the following figure:

![](../../assets/image/comment-en.png)

>PS: This feature is only available in the Pro version (commercial version) and not in the open source version. Pro version preview address: http://aieditor-pro.jpress.cn
## How to Use

```typescript
new AiEditor({
    element: "#aiEditor",
    comment: {
        enable: true,
        onCommentActivated: (commentIds) => {
            //When a comment is activated, the mouse selects (or clicks) on a piece of flagged content
        },

        onCommentCreate: (commentId, content, callback) => {
            //When a comment is created, the data should be stored in the database via an http request
            //After saving successfully, callback is called to make the comment valid
        },

        onCommentDelete: (commentId, callback) => {
           //When comments are deleted
        },

        onCommentQuery: (commentId, callback) => {
            //Query the comment content based on the comment id when first loaded
        }
    },
})
```

- **enable**: indicates whether to enable the comment function
- **onCommentActivated**: When a comment is created, we should save the comment content to the database and return the full comment information
- **onCommentCreate**: Listen for a comment to be created, at which point we should save the comment to the database and return the full comment
- **onCommentDelete**: The listening comment was deleted, and the comments in the database should be deleted simultaneously
- **onCommentQuery**: When first loaded, query the comments


## Sample code

The following example code uses LocalStorage to save the comment content

```typescript
const colors = ['#3f3f3f', '#938953', '#548dd4', '#95b3d7', 
    '#d99694', '#c3d69b', '#b2a2c7', '#92cddc', '#fac08f'];
new AiEditor({
    element: "#aiEditor",
    comment: {
        enable: true,
        onCommentActivated: (commentIds) => {
            //The user mouse clicks (or selects) the content with the comment
            console.log("commentIds", commentIds)
        },

        onCommentCreate: (commentId, content, callback) => {
            //Generate a new comment based on the comment id and content
            const comment = {
                id: commentId,
                account:"jason",
                avatar:"https://aieditor.dev/assets/image/logo.png",
                mainColor:colors[Math.floor(Math.random() * colors.length)],
                createdAt:"2024-05-26 10:23:56",
                content
            } as CommentInfo;
            
            //Save the comments to localStorage
            localStorage.setItem("comment-" + commentId, JSON.stringify(comment));
            
            //Calling callback returns the comment information
            return callback(comment);
        },

        onCommentDelete: (commentId, callback) => {
            //Delete comment
            localStorage.removeItem("comment-"+commentId);
            return callback();
        },

        onCommentQuery: (commentId, callback) => {
            //Get comment information from localStorage
            const contentJSON = localStorage.getItem("comment-"+commentId);
            if (!contentJSON) return false;

            //Calling callback returns the comment information
            return callback(JSON.parse(contentJSON))
        }
    },
})
```


**CommentInfo** Description of the comment information
- id: indicates the comment id, which is globally unique
- account: The account or nickname of the comment
- avatar: indicates the URL of the user profile picture
- mainColor: background color of the comment text
- createdAt: Comment time
- content: Comment content