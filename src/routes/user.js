const express = require("express");
const auth = require("../middleware/auth");
const UserController = require('../controllers/UserController');
const router = new express.Router();
const { supabase } = require('../utils/initSupabase');
const { getUrl } = require('../utils/getPublicUrl');
const multer = require("multer");

// Use the JS library to create a bucket.

//const { data, error } = await supabase.storage.createBucket('avatars')

const uploads = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

router.post("/users", UserController.registerUser);

router.post("/users/login", UserController.loginUser);

router.get("/users/verify/:userID", UserController.verifyUser);

router.post("/users/logout", auth, UserController.logoutUser);

router.post("/users/logoutAll", auth, UserController.logoutAllUser);

router.get("/users/me", auth, UserController.getCurrentUser);

router.patch("/users/me", auth, UserController.updateUser);

router.delete("/users/me", auth, UserController.deleteUser);

router.post("/users/me/avatar", auth, uploads.single("avatar"), UserController.uploadAvatar);

router.delete("/users/me/avatar", auth, UserController.deleteAvatar);

module.exports = router;
