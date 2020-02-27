# task-manager-api

### Query the following endpoints for the user routes

Add a user by sending name, email and password

*  /users(post)

Login by sending email and password

*  /users/login(post)

Logs outs current user

*  /users/logout(post)

Logs out current user from all instances

*  /users/logoutAll(post)

Modify any of name, email, password and age

* /users/me(patch)

Delete profile

* /users/me(delete)

Upload avatar/profile picture

*  /users/me/avatar(post)

Delete your avatar

* /users/me/avatar(delete)

Retrieve your avatar

* /users/:id/avatar(get)


### Query the following endpoints for the task routes

Add a new Task, sending description and completed status (boolean)

* /tasks(post)

Retrieve all yours tasks

* /tasks(get)

Retrieve a specific task with it's ID

* /tasks/:id(get)

Modify a task with it's ID

* /tasks/:id(patch)

Delete a task

* /tasks/:id(delete)
