# feathers-loopback-connector

[![Build Status](https://travis-ci.org/feathersjs/feathers-loopback-connector.png?branch=master)](https://travis-ci.org/feathersjs/feathers-loopback-connector)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-loopback-connector/badges/gpa.svg)](https://codeclimate.com/github/feathersjs/feathers-loopback-connector)
[![Test Coverage](https://codeclimate.com/github/feathersjs/feathers-loopback-connector/badges/coverage.svg)](https://codeclimate.com/github/feathersjs/feathers-loopback-connector/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs/feathers-loopback-connector.svg?style=flat-square)](https://david-dm.org/feathersjs/feathers-loopback-connector)
[![Download Status](https://img.shields.io/npm/dm/feathers-loopback-connector.svg?style=flat-square)](https://www.npmjs.com/package/feathers-loopback-connector)

> 

## Installation

```
npm install feathers-loopback-connector --save
```

## Documentation

Please refer to the [feathers-loopback-connector documentation](http://docs.feathersjs.com/) for more details.

## Complete Example

Here's an example of a Feathers server that uses `feathers-loopback-connector`. 

```js
var feathers = require('feathers');
var bodyParser = require('body-parser');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var loopbackConnector = require('../lib');
var DataSource = require('loopback-datasource-juggler').DataSource;
var ModelBuilder = require('loopback-datasource-juggler').ModelBuilder;
var ds = new DataSource('memory');
/* MongoDB connector Example
var ds = new DataSource({
    connector: require('loopback-connector-mongodb'),
    host: 'localhost',
    port: 27017,
    database: 'mydb'
});
*/
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
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
