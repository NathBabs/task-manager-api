const Task = require("../database/models/task");
const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const TaskController = require('../controllers/TaskController');

router.post("/task/add", auth, TaskController.createTask);

//GET /tasks?completed=true
// limit and skip
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
router.get("/task", auth, TaskController.getTasks);

router.get("/task/:id", auth, TaskController.getTaskById);


router.patch("/task/:id", auth, TaskController.updateTask)

router.delete("/task/delete/:id", auth, TaskController.deleteTask)

module.exports = router;
