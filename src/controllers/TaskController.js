// noinspection BadExpressionStatementJS
const Task = require("../database/models/task");
const express = require("express");
const qs = require('query-string');
const moment = require("moment");

exports.createTask = async (req, res) => {
    // "due" should be in the form of YYYYMMDD in body
    req.body.due = new Date(moment(req.body.due).format('YYYY-MM-DD'));
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        return res.status(201).send(task);
    } catch (e) {
        res.status(400).send();
    }

};

//GET /tasks?completed=true
// limit and skip
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
// ?due=true => all tasks less than today => $lt
// date=20220203 NOTE: you can't query for both due and a particular date in a particular request
// else the date will override the due query
exports.getTasks = async (req, res) => {
    let match = {};
    const sort = {};
    //console.log(req.query);
//TODO: build the match options object with query from req.query
    const url = req.originalUrl.split("?");
    const queryRemoved = url.splice(0, 1);

    const parsed = qs.parse(url[0], {
        parseBooleans: true,
        arrayFormat: "comma"
    });
    //console.log(parsed)

    // set each of the parsed queries key and value into match
    for (const [key, value] of Object.entries(parsed)) {
        if(key === 'sortBy') {
            return;
        }
        match[key] = value;
    }

    // modify the match object for array query with mongoose
    if(match['tags']){
        const temp = match['tags'];
        match['tags'] = {
            $in: temp
        }
    }

    if(match['due']){
        const temp = match['due'];
        match['due'] = {
            $lt: moment().startOf("day").toDate()
        }
    }

    // format match[date] and rename key to match[due]
    if (match['date']) {
        const temp = match['date'];
        match['date'] = {
            $gte: new Date(moment(temp).format('YYYY-MM-DD')),
            $lt: new Date(moment(temp).add(1, "day").endOf('day').format('YYYY-MM-DD'))
        };

        // rename date key to due
        let {date: due, ...rest} = match;
        match = {
            due,
            ...rest
        }
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user
            .populate({
                path: "tasks",
                match,
                options: {
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort
                }
            })
            .execPopulate();

        return res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    }
};

exports.getTaskById = async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        return res.send(task);
    } catch (e) {
        res.status(500).send();
    }

};

exports.updateTask = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["description", "completed"];
    const isValidOperation = updates.every(update => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid update" });
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!task) {
            return res.status(404).send();
        }
        //for each update in the updates array, use it to set a property on the task document
        updates.forEach(update => {
            //set user properties dynamically with properties from request.body
            task[update] = req.body[update];
        });
        await task.save();
        return res.send(task);
    } catch (e) {
        return res.status(400).send(e);
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch (e) {
        res.status(500).send();
    }
};

// exports.findDueTasks = async (req, res) => {
//     try {
//         const
//     }catch (e) {
//
//     }
// }

