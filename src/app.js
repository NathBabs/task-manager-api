const express = require('express');
require('./db/mongoose');
const morgan = require('morgan');
const mongoose = require('mongoose');
const routes = require('./routes');

const app = express();
//const port = process.env.PORT;

app.use(morgan('dev'))
app.use(express.json());
app.use(routes);


//
//Without middleware : new request -> run route handler
//
//With middleware : new request -> do something  -> run route handler
//

module.exports = app

