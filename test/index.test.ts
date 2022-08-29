import tests from '@feathersjs/adapter-tests';
import errors from '@feathersjs/errors'
import { feathers } from '@feathersjs/feathers';
import { DataSource } from 'loopback-datasource-juggler';
const ds = new DataSource('memory');
import { LoopBackService } from '../src/service';

const testSuite = tests([
  '.options',
  '.events',
  '._get',
  '._find',
  '._create',
  '._update',
  '._patch',
  '._remove',
  '.$get',
  '.$find',
  '.$create',
  '.$update',
  '.$patch',
  '.$remove',
  '.get',
  '.get + $select',
  '.get + id + query',
  '.get + NotFound',
  '.get + id + query id',
  '.find',
  '.find + paginate + query',
  '.remove',
  '.remove + $select',
  '.remove + id + query',
  '.remove + multi',
  '.remove + multi no pagination',
  '.remove + id + query id',
  '.update',
  '.update + $select',
  '.update + id + query',
  '.update + NotFound',
  '.update + id + query id',
  '.update + query + NotFound',
  '.patch',
  '.patch + $select',
  '.patch + id + query',
  '.patch multiple',
  '.patch multiple no pagination',
  '.patch multi query same',
  '.patch multi query changed',
  '.patch + query + NotFound',
  '.patch + NotFound',
  '.patch + id + query id',
  '.create',
  '.create + $select',
  '.create multi',
  'internal .find',
  'internal .get',
  'internal .create',
  'internal .update',
  'internal .patch',
  'internal .remove',
  '.find + equal',
  '.find + equal multiple',
  '.find + $sort',
  '.find + $sort + string',
  '.find + $limit',
  '.find + $limit 0',
  '.find + $skip',
  '.find + $select',
  '.find + $or',
  '.find + $in',
  '.find + $nin',
  '.find + $lt',
  '.find + $lte',
  '.find + $gt',
  '.find + $gte',
  '.find + $ne',
  '.find + $gt + $lt + $sort',
  '.find + $or nested + $sort',
  '.find + paginate',
  '.find + paginate + $limit + $skip',
  '.find + paginate + $limit 0',
  '.find + paginate + params',
  'params.adapter + paginate',
  'params.adapter + multi'
]);


describe('Feathers Loopback Service', () => {
  var Model = ds.createModel('people', {
    _id: { type: Number },
    name: { type: String },
    age: { type: Number },
    friends: { type: Array },
    team: { type: String },
    $push: {
      friends: { type: String }
    },
    // name: { type: String },
    // age: { type: Number },
    // created: { type: Boolean },
    // time: { type: Number }
  });

  const app = feathers()
    .use('people', new LoopBackService({
      model: Model,
      events: ['testing'],
      paginate: {
        default: 10,
        max: 100
      }
    }));

  testSuite(app, errors, 'people', 'id')
});
