import {
    createPost, editPost, deletePost, getPosts, getPostInfo,
    getPostsCount, getChildrenComments, getLevel_0_Comments
} from "../controllers/postController.js";
import { addComment, deleteComment, addLike, addCollect, editComment } from "../controllers/postFeedback.js";
import { Router } from "express";
import { loginCheck } from "../middlewares/loginCheck.js";
import { accessCheck } from "../middlewares/accessCheck.js";

const route = Router();

// 文章相關
route.post("/createPost", loginCheck, createPost);
route.put("/editPost/:postId", loginCheck, accessCheck, editPost);
route.delete("/deletePost/:postId", loginCheck, accessCheck, deletePost);
route.post("/addCollect/:postId/", loginCheck, addCollect);

// 文章、留言都共用
route.post("/addLike/:idType/:id/", loginCheck, addLike);

// 留言相關
route.post("/addComment/:postId/:parentCommentId?", loginCheck, addComment);
route.delete("/deleteComment/:commentId", loginCheck, accessCheck, deleteComment);
route.put("/editComment/:commentId", loginCheck, accessCheck, editComment);

// 獲取一定數量的文章(首頁)
route.get("/getPosts/:sortBy/:limitSize/:page/:direction/:tags?", getPosts);
// 獲取文章總數(首頁)
route.get("/getPostsCount/:tags?", getPostsCount);

// 獲取文章資訊(點進去文章頁面)
route.get("/getPostInfo/:postId", getPostInfo);

// 獲取level 0留言
route.get("/getLevel_0_Comments/:postId", getLevel_0_Comments);
// 獲取子留言
route.get("/getChildrenComments/:commentId", getChildrenComments);


export default route;