import { createPost, editPost, deletePost, addComment, addLike, addCollect } from "../controllers/postController.js";
import { Router } from "express";
import { loginCheck } from "../middlewares/loginCheck.js";
import { postOwnerCheck } from "../middlewares/postOwnerCheck.js";

const route = Router();

route.post("/createPost", loginCheck, createPost);
route.put("/editPost/:postId", loginCheck, postOwnerCheck, editPost);
route.delete("/deletePost/:postId", loginCheck, postOwnerCheck, deletePost);
route.post("/addComment/:postId/", loginCheck, addComment);
route.post("/addLike/:postId/", loginCheck, addLike);
route.post("/addCollect/:postId/", loginCheck, addCollect);


export default route;