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

## Supported Loopback specific queries

On top of the standard, cross-adapter [queries](http://docs.feathersjs.com/databases/querying.html), feathers-loopback-connector also supports [Loopback specific queries](http://loopback.io/doc/en/lb3/Where-filter.html).

### $and

```js
query: {
  $and: [{ field1: 'foo' }, { field2: 'bar' }]
}
```
### $between

```js
query: {
  size: { $between: [0,7] }
}
```

### $inq

```js
query: {
  id: { $inq: [123, 234] }
}
```

### $like

```js
query: {
  name: { $like: '%St%' }
}
```

### $nlike

```js
query: {
  name: { $nlike: 'M%XY' }
}
```

### $ilike

```js
query: {
  title: { $ilike: 'm.-st' }
}
```

### $nilike

```js
query: {
  title: { $nilike: 'm.-xy' }
}
```

### $regexp

```js
query: {
  title: { $regexp: '^T' }
}
```

### $near

```js
location = '42.266271,-72.6700016';  // String
location = [42.266271, -72.6700016]; // Array
location = { lat: 42.266271, lng: -72.6700016 };  // Object Literal
query: {
  geo: { $near: location }
}
```

### $maxDistance

```js
query: {
    geo: {
        $near: location,
        $maxDistance: 2
    }
}
```

### $minDistance

```js
query: {
    geo: {
        $near: location,
        $minDistance: 2
    }
}
```

### $unit

To change the units of measurement, specify unit property to one of the following:

kilometers  
meters  
miles  
feet  
radians  
degrees  
```js
query: {
    geo: {
        $near: location,
        $maxDistance: 2,
        $unit: 'kilometers'
    }
}
```

## License

Copyright (c) 2017

Licensed under the [MIT license](LICENSE).
