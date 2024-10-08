import { createPost, editPost, deletePost } from "../controllers/postController.js";
import { Router } from "express";
import { loginCheck } from "../middlewares/loginCheck.js";
import { postOwnerCheck } from "../middlewares/postOwnerCheck.js";

const postRoutes = Router();

postRoutes.post("/createPost", loginCheck, createPost);
postRoutes.put("/editPost/:postId", loginCheck, postOwnerCheck, editPost);
postRoutes.delete("/deletePost/:postId", loginCheck, postOwnerCheck, deletePost);

export default postRoutes;