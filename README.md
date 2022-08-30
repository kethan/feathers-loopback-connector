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

```ts
import { feathers } from '@feathersjs/feathers'
import express, { json, urlencoded, rest } from '@feathersjs/express'
import { LoopBackService } from 'feathers-loopback-connector';
import { DataSource } from 'loopback-datasource-juggler';
const ds = new DataSource('memory');
// mongodb or postgresql
// const ds = new DataSource({
//     connector: 'loopback-connector-mongodb',
//     connector: 'loopback-connector-postgresql',
//     url: ""
// });

interface Message {
    id: number
    text: string
}

type ServiceTypes = {
    messages: LoopBackService<Message>;
}

const app = express(feathers<ServiceTypes>());

app.use(json())
app.use(urlencoded({ extended: true }))
app.configure(rest());

var MessageSchema = ds.createModel('messages', {
    id: { type: Number },
    text: { type: String }
});

app.use('messages', new LoopBackService({
    id: "_id",
    multi: true,
    model: MessageSchema,
    paginate: {
        default: 10,
        max: 100
    }
}));

app
    .listen(3000, () => {
        console.log('Feathers server listening on localhost:3000')
    });
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
