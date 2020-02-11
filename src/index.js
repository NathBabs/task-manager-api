const app = require('./app');
const port = process.env.PORT;

//Without middleware : new request -> run route handler
//
//With middleware : new request -> do something  -> run route handler
//

app.listen(port, () => {
    console.log('Server is up on port ' + port);
});
