var feathers = require('feathers');
var bodyParser = require('body-parser');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var loopbackConnector = require('../lib');

var DataSource = require('loopback-datasource-juggler').DataSource;
var ModelBuilder = require('loopback-datasource-juggler').ModelBuilder;
var ds = new DataSource('memory');

// Create a feathers instance.
const app = feathers()
    // Enable REST services
    .configure(rest())
    // Enable REST services
    .configure(socketio())
    // Turn on JSON parser for REST services
    .use(bodyParser.json())
    // Turn on URL-encoded parser for REST services
    .use(bodyParser.urlencoded({ extended: true }));

var MessageSchema = ds.createModel('message', {
    title: { type: String },
    body: { type: String }
});

// Create an in-memory Feathers service with a default page size of 2 items
// and a maximum size of 4
app.use('/messages', loopbackConnector({
    Model: MessageSchema,
    paginate: {
        default: 2,
        max: 4
    }
}));

// Start the server
module.exports = app.listen(3030);
