// const assert = require('assert');
// const expect = require('chai');
const tests = require('feathers-service-tests');
// const Proto = require('uberproto');
const errors = require('feathers-errors');
const feathers = require('feathers');
const server = require('../example/app');
var DataSource = require('loopback-datasource-juggler').DataSource;
var ds = new DataSource('memory');
const Service = require('../src');

describe('Feathers Loopback Service', () => {
  var Model = ds.createModel('people', {
    name: { type: String },
    age: { type: Number },
    created: { type: Boolean },
    time: { type: Number }
  });
  // before(() =>
  //     Model.sync({ force: true })
  //         .then(() => CustomId.sync({ force: true }))
  // );

  // describe('Initialization', () => {
  //     it('throws an error when missing options', () => {
  //         expect(Service.bind(null)).to.throw('Sequelize options have to be provided');
  //     });

  //     it('throws an error when missing a Model', () => {
  //         expect(Service.bind(null, { name: 'Test' })).to.throw(/You must provide a Sequelize Model/);
  //     });
  // });

  describe('Common functionality', () => {
    const app = feathers()
      .use('/people', Service({
        Model: Model,
        events: ['testing']
      }));
    // .use('/people-customid', new Service({
    //     Model: CustomId,
    //     events: ['testing'],
    //     //id: 'customid'
    // }));

    // it('allows querying for null values (#45)', () => {
    //   const name = 'Null test';
    //   const people = app.service('people');

    //   return people.create({ name }).then(person =>
    //     people.find({ query: { age: null } }).then(people => {
    //       assert.equal(people.length, 1);
    //       assert.equal(people[0].name, name);
    //       assert.equal(people[0].age, null);
    //     }).then(() => people.remove(person.id))
    //   );
    // });

    tests.base(app, errors);
    // tests.base(app, errors, 'people-customid', 'customid');
  });
});

describe('Sequelize service example test', () => {
  after(done => server.close(() => done()));

  // tests.example();
});
