import { createPost, editPost, deletePost, getAllPosts, getPostInfo } from "../controllers/postController.js";
import { addComment,deleteComment, addLike, addCollect } from "../controllers/postFeedback.js";
import { Router } from "express";
import { loginCheck } from "../middlewares/loginCheck.js";
import { postOwnerCheck } from "../middlewares/postOwnerCheck.js";
import { accessCheck } from "../middlewares/accessCheck.js";

const route = Router();

route.post("/createPost", loginCheck, createPost);
route.put("/editPost/:postId", loginCheck, postOwnerCheck, editPost);
route.delete("/deletePost/:postId", loginCheck, postOwnerCheck, deletePost);
route.post("/addLike/:postId/", loginCheck, addLike);
route.post("/addCollect/:postId/", loginCheck, addCollect);

route.post("/addComment/:postId/:parentCommentId?", loginCheck, addComment);
route.delete("/deleteComment/:postId/:commentId",loginCheck, accessCheck, deleteComment);

route.get("/getAllPosts", getAllPosts);
route.get("/getPostInfo/:postId", getPostInfo);
// route.get("/getComments/:postId", getComments);

export default route;