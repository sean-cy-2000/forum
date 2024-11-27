import { createPost, editPost, deletePost, getPosts } from "../controllers/postController.js";
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
route.get("/getPosts/:sortBy/:limitSize/:direction/:tags?",getPosts);

// route.get("/getPostInfo/:postId", getPostInfo);


export default route;