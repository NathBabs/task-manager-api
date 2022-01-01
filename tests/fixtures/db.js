const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/database/models/user');
const Task = require('../../src/database/models/task');

const userOneID = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneID,
  name: "Blessing",
  email: "Blessing@andi.com",
  password: "base64!!",
  tokens: [
    {
      token: jwt.sign({ _id: userOneID }, process.env.JWT_SECRET)
    }
  ]
};

const userTwoID = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoID,
  name: "Gift",
  email: "Gift@andi.com",
  password: "pushtodb",
  tokens: [
    {
      token: jwt.sign({ _id: userTwoID }, process.env.JWT_SECRET)
    }
  ]
};

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Complete testing with Jest',
    completed: false,
    owner: userOneID
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Compplete graphQL',
    completed: true,
    owner: userOneID
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Get employed',
    completed: true,
    owner: userTwoID
}



const setupDatabse = async () => {
    await User.deleteMany();
    await Task.deleteMany();
    await new User(userOne).save();
    await new User(userTwo).save();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
}

module.exports = {
    userOneID,
    userOne,
    userTwo,
    userTwoID,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabse
}