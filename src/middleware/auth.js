const jwt = require('jsonwebtoken');
const User = require('../database/models/user');

const auth = async (req, res, next)  => {
    try {
        //validate the token , from the header
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({_id : decoded._id, 'tokens.token' : token});

        if (!user) {
            throw new Error();
        }

    //since this method has already found the user, there's no need for the route handler to start finding the user again.
        req.token = token;
        req.user = user;
        next();
        //console.log(token);
    } catch (e) {
        res.status(401).send({
            error : 'Please authenticate'
        });
    }
};

module.exports = auth;