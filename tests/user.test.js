const request = require("supertest");
const app = require("../src/app");
const User = require("../src/database/models/user");
const { userOne, userOneID, setupDatabse } = require('./fixtures/db');


beforeEach(setupDatabse);

test("Should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Nath",
      email: "nathb@example.com",
      password: "MyPass777!"
    })
    .expect(201);

    //Assert that the databse was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull()

    //Assert about the response body
    expect(response.body).toMatchObject({
      user: {
        name: "Nath",
        email: "nathb@example.com"
      },
      token: user.tokens[0].token
    })

    expect(user.password).not.toBe('MyPass777!');
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password
    })
    .expect(200);

    const user = await User.findById(response.body.user._id)
    expect(response.body.token).toBe(user.tokens[1].token)
});

test("Should not login nonexistent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "musiliu@bilau.com",
      password: "shakiratluv"
    })
    .expect(400);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
  await request(app)
    .get("/users/me")
    .send()
    .expect(401);
});

test("Should delete account for user", async () => {
  const response = await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneID);
  expect(user).toBeNull()
});

test("Should not delete account for unauthenticated user", async () => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401);
});

test('should upload avatar image', async () => {
    await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

    const user = await User.findById(userOneID);
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test("Should update valid user fields", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Filipo"
    })
    .expect(200);
    const user = await User.findById(userOneID);
    expect(user.name).toBe('Filipo');
});

test("Should not update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: "UBA House No 57, Marina Rd "
    })
    .expect(400);
});