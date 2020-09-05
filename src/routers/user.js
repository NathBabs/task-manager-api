const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendCancellationEmail, sendOptInMail } = require('../emails/account');
const sharp = require('sharp');
const router = new express.Router();
const multer = require("multer");
const uploads = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
      return cb(new Error('Please upload an image'));
    }

    cb(undefined, true);
  }
});

router.post("/users", async (req, res) => {
  const fullUser = {...req.body, active: 0};
  const user = new User(fullUser);

  try {
    const unverifiedUser = await user.save();
    //sendWelcomeEmail(user.email, user.name);
    sendOptInMail(user.email, unverifiedUser._id);
    //console.log(unverifiedUser);

    //const token = await user.generateAuthToken();
    res.status(201).send({
      user: user,
      msg: "You've been registered. Please check your email for the verification link."
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user: user, token: token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    //return a filtered token array that doesn't contain the current token being returned from the auth.js file
    req.user.tokens = req.user.tokens.filter(token => {
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
  const isValidOperation = updates.every(update => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    updates.forEach(update => {
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

router.post("/users/me/avatar", auth, uploads.single("avatar"), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();

  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({error : error.message});
});

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
})

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error('');
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
