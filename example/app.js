var feathers = require('feathers');
var bodyParser = require('body-parser');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var loopbackConnector = require('../lib');
var DataSource = require('loopback-datasource-juggler').DataSource;
var ModelBuilder = require('loopback-datasource-juggler').ModelBuilder;
var ds = new DataSource('memory');

const app = feathers()
    .configure(rest())
    .configure(socketio())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }));

var MessageSchema = ds.createModel('message', {
    title: { type: String },
    body: { type: String }
});
app.use('/messages', loopbackConnector({
    Model: MessageSchema,
    paginate: {
        default: 2,
        max: 4
    }
}));

module.exports = app.listen(3030);
