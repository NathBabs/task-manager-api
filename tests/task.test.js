const request = require('supertest');
const app = require("../src/app");
const Task = require('../src/models/task');
const { 
    userTwo,
    userTwoID, 
    userOne, 
    userOneID,
    taskOne,
    taskTwo,
    taskThree, 
    setupDatabse
 } = require('./fixtures/db');

beforeEach(setupDatabse);

test("Should create task for user", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "Slap somebody today"
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toBe(false);
});

test("Should not create a task with invalid description/completed", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: Number,
      completed: 9
    })
    .expect(400);
});

test('Should retrieve tasks for a given user', async () => {
    const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200);

    expect(response.body.length).toBe(2);
})

test("Should fail in deleting another user's task", async () => {
    await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .expect(404);

    const tasks = await Task.find({owner : userOneID});
    expect(tasks[0]).not.toBeNull();
});

test("Should not create a task with invalid description/completed", async () => {
    await request(app)
      .patch(`/tasks/${taskOne._id}`)
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send({
        description: Number,
        completed: 9
      })
      .expect(400);  
  });
