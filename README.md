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
const feathers = require('feathers');
const rest = require('feathers-rest');
const hooks = require('feathers-hooks');
const bodyParser = require('body-parser');
const errorHandler = require('feathers-errors/handler');
const plugin = require('feathers-loopback-connector');

// Initialize the application
const app = feathers()
  .configure(rest())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // Initialize your feathers plugin
  .use('/plugin', plugin())
  .use(errorHandler());

app.listen(3030);

console.log('Feathers app started on 127.0.0.1:3030');
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
