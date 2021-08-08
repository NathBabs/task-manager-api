const express = require("express");
//const { nanoid } = require('nanoid');
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';
const nanoid = customAlphabet(alphabet, 12);
const User = require("../models/user");
const auth = require("../middleware/auth");
const {
  sendWelcomeEmail,
  sendCancellationEmail,
  sendOptInMail,
} = require("../emails/account");
const sharp = require("sharp");
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

router.post("/users", async (req, res) => {
  const fullUser = { ...req.body, active: 0 };
  const user = new User(fullUser);

  try {
    const unverifiedUser = await user.save();
    sendOptInMail(user.email, unverifiedUser._id);

    res.status(201).send({
      user: user,
      msg:
        "You've been registered. Please check your email for the verification link.",
    });
  } catch (e) {
    console.log(e)
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    if (!user.active) {
      res.status(401).send({
        msg:
          "Your account hasn't been activated yet, please check your email and activate",
      });
    }

    const token = await user.generateAuthToken();
    res.send({ user: user, token: token });
  } catch (e) {
    res.status(400).send();
  }
});

router.get("/users/verify/:userID", async (req, res) => {
  try {
    let user = await User.findById(req.params.userID);

    if (!user) {
      throw new Error("");
    }

    if (user.active === true) {
      res.status(409).send({
        msg: "You have already been verified",
      });
    }

    user.active = true;
    const verfiedUser = await user.save();
    res.status(200).send({
      user: verfiedUser,
      msg: "Your account has now been verified, you can now login",
    });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    //return a filtered token array that doesn't contain the current token being returned from the auth.js file
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token != req.token;
    });
    //save the modified user, that the current token has been removed
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();

    return res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    const email = req.user.email;
    const name = req.user.name;
    await req.user.remove();
    sendCancellationEmail(email, name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

router.post(
  "/users/me/avatar",
  auth,
  uploads.single("avatar"),
  async (req, res) => {
    //const key = `${req.user._id}/${nanoid(12)}`
    try {
      // resize image with sharp
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();

      // get file extension and generate filename
      const ext = req.file.originalname.split('.').pop()
      const fileName = `${nanoid()}.${ext}`

      // save to supabase bucket here
      const { data, error } = await supabase
        .storage
        .from('avatar')
        .upload(`${req.user._id}/${fileName}`, buffer, {
          contentType: req.file.mimeType
        });

      // get public url from supabase
      const url = await getUrl('avatars', `${req.user._id}/${fileName}`)

      req.user.avatar = url;
      await req.user.save();
      res.status(201).send({
        sucess: true,
        data,
        url
      });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  });

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error("");
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
