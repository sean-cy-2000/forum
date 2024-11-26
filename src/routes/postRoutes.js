import { createPost, editPost, deletePost, getAllPosts, getPostInfo } from "../controllers/postController.js";
import { addComment, deleteComment, addLike, addCollect, editComment } from "../controllers/postFeedback.js";
import { Router } from "express";
import { loginCheck } from "../middlewares/loginCheck.js";
// import { postOwnerCheck } from "../middlewares/postOwnerCheck.js";
import { accessCheck } from "../middlewares/accessCheck.js";

const route = Router();

route.post("/createPost", loginCheck, createPost);
route.put("/editPost/:postId", loginCheck, accessCheck, editPost);
route.put("/editComment/:commentId", loginCheck, accessCheck, editComment);
route.post("/addLike/:idType/:id/", loginCheck, addLike);
route.delete("/deletePost/:postId", loginCheck, accessCheck, deletePost);
route.post("/addCollect/:postId/", loginCheck, addCollect);

route.post("/addComment/:postId/:parentCommentId?", loginCheck, addComment);
route.delete("/deleteComment/:commentId", loginCheck, accessCheck, deleteComment);

route.get("/getAllPosts", getAllPosts);
route.get("/getPostInfo/:postId", getPostInfo);

export default route;