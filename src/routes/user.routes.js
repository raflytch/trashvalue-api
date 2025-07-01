import express from "express";
import {
  register,
  login,
  getUsers,
  getUserDetail,
  deleteUserById,
  updateUserRole,
  updateUser,
} from "../controllers/user.controller.js";
import upload from "../middlewares/upload.js";
import roleMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "backgroundPhoto", maxCount: 1 },
  ]),
  register
);
router.post("/login", login);
router.get("/", roleMiddleware("ADMIN"), getUsers);
router.get("/:id", roleMiddleware("ADMIN", "USER"), getUserDetail);
router.delete("/:id", roleMiddleware("ADMIN"), deleteUserById);
router.patch("/:id/role", roleMiddleware("ADMIN", "USER"), updateUserRole);
router.patch(
  "/:id",
  roleMiddleware("ADMIN", "USER"),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "backgroundPhoto", maxCount: 1 },
  ]),
  updateUser
);

export default router;
