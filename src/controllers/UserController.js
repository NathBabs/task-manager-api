const express = require("express");
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';
const nanoid = customAlphabet(alphabet, 12);
const User = require("../database/models/user");
const {
    sendWelcomeEmail,
    sendCancellationEmail,
    sendOptInMail,
} = require("../emails/account");
const sharp = require("sharp");
const { supabase } = require('../utils/initSupabase');
const { getUrl } = require('../utils/getPublicUrl');

// Use the JS library to create a bucket.

//const { data, error } = await supabase.storage.createBucket('avatars')

exports.registerUser = async (req, res) => {
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
}

exports.loginUser = async (req, res) => {
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
}


exports.verifyUser = async (req, res) => {
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
};

exports.logoutUser = async (req, res) => {
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
};

exports.logoutAllUser = async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
};

exports.getCurrentUser = async (req, res) => {
    res.send(req.user);
};

exports.updateUser = async (req, res) => {
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
};

exports.deleteUser = async (req, res) => {
    try {
        const email = req.user.email;
        const name = req.user.name;
        await req.user.remove();
        sendCancellationEmail(email, name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
};


exports.uploadAvatar = async (req, res) => {
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

            if (error) throw new Error(error)

            // get public url from supabase
            const url = await getUrl('avatar', `${req.user._id}/${fileName}`)

            req.user.avatar = url;
            await req.user.save();
            res.status(201).send({
                success: true,
                data,
                url,
            });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    };

exports.deleteAvatar = async (req, res) => {
    // get the folder name along with the object id from req.user.avatar
    const url = req.user.avatar
    // get folder and file name to delete
    const fileToDelete = url.substring(url.length - 41)


    // delete file from storage
    const { data, error } = await supabase.storage.from('avatar').remove([`${fileToDelete}`]);

    if (error) {
        return res.status(500).send({
            success: false,
            error: error
        })
    }
    req.user.avatar = undefined;
    await req.user.save();
    return res.status(200).send({
        success: true,
        data: data
    });
};
