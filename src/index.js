const errors = require('feathers-errors');
const makeDebug = require('debug');
const debug = makeDebug('feathers-loopback-connector');
const error = makeDebug('feathers-loopback-connector:error');
const commons = require('feathers-commons');
if (!global._babelPolyfill) { require('babel-polyfill'); }

class Service {
  // options;
  // model;

  constructor(options = {}) {
    this.options = options;
    this.paginate = options.paginate || {};
    this.id = options.id || 'id';
    this.events = options.events || [];
    this.model = options.Model;
  }

  // extend(obj) {
  //     return Proto.extend(obj, this);
  // }

  parse(number) {
    if (typeof number !== 'undefined') {
      return Math.abs(parseInt(number, 10));
    }
  }

  getLimit(limit, paginate) {
    if (paginate && paginate.default) {
      const lower = typeof limit === 'number' ? limit : paginate.default;
      const upper = typeof paginate.max === 'number' ? paginate.max : Number.MAX_VALUE;
      return Math.min(lower, upper);
    }
    return limit;
  }

  transformQuery(queryParams, paginate) {
    let query = JSON.parse(JSON.stringify(queryParams));
    let newQuery = {};
    if (query.query) {
      if (paginate) {
        debug('Paginate', paginate);
        newQuery.limit = paginate.default;
      }
      if (query.query.$sort) {
        let sorts = [];
        for (var i in query.query.$sort) {
          if (query.query.$sort[i] === 1 || query.query.$sort[i] === '1')
            sorts.push(i + ' ASC');
          if (query.query.$sort[i] === -1 || query.query.$sort[i] === '-1')
            sorts.push(i + ' DESC');
        }
        newQuery.order = sorts;
        delete query.query.$sort;
      }
      if (query.query.$select) {
        let select = {};
        query.query.$select.forEach((item) => {
          select[item] = true;
        });
        newQuery.fields = select;
        delete query.query.$select;
      }
      if (query.query.$limit) {
        newQuery.limit = this.getLimit(this.parse(query.query.$limit), paginate);
        delete query.query.$limit;
      }
      if (query.query.$skip) {
        newQuery.skip = query.query.$skip;
        delete query.query.$skip;
      }
      var replaced = JSON.stringify(query.query)
        .replace(/\$in/g, 'inq')
        .replace(/\$nin/g, 'nin')
        .replace(/\$lt/g, 'lt')
        .replace(/\$lte/g, 'lte')
        .replace(/\$gt/g, 'gt')
        .replace(/\$gte/g, 'gte')
        .replace(/\$ne/g, 'neq')
        .replace(/\$or/g, 'or');
      newQuery.where = JSON.parse(replaced);
      debug('New Query', newQuery);
      return newQuery;
    }
    return queryParams;
  }

  find(params) {
    const paginate = (params && typeof params.paginate !== 'undefined') ? params.paginate : this.paginate;
    params.query = params.query || {};
    if (!paginate.default) {
      return this.model.find(this.transformQuery(params, paginate));
    }
    return this.model.find(this.transformQuery(params, paginate))
      .then((results) => {
        return this.model.count(this.transformQuery(params, paginate).where)
          .then((count) => {
            return Promise.resolve({
              total: count,
              limit: this.getLimit(this.parse(params.query.$limit), paginate),
              skip: params.query.$skip ? params.query.$skip : 0,
              data: results
            });
          });
      });
  }

  get(id, params) {
    return this.model.findById(id).then(result => {
      if (!result) {
        return Promise.reject(
          new errors.NotFound(`No record found for id '${id}'`)
        );
      }
      return Promise.resolve(result)
        .then(commons.select(params, this.id));
    });
  }
  create(data, params) {
    if (data instanceof Array) {
      return this.model.create(data);
    }
    else {
      return this.model.create(data)
        .then(commons.select(params, this.id))
    }
  }
  update(id, data, params) {
    if (Array.isArray(data) || id === null) {
      return Promise.reject(new errors.BadRequest('Not replacing multiple records. Did you mean `patch`?'));
    }

    return this.model.replaceById(id, data)
      .then(result => {
        return Promise.resolve(result)
          .then(commons.select(params, this.id));
      }).catch(() => {
        return Promise.reject(
          new errors.NotFound(`No record found for id '${id}'`)
        );
      });
  }
  patch(id, data, params) {
    if (id === null) {
      return this.model.updateAll(this.transformQuery(params).where, data)
        .then((result) => {
          params.query = data;
          return this.whatData(this.transformQuery(params))
            .then((res) => {
              return Promise.resolve(res);
            });
        });
    }
    return this.model.findById(id)
      .then(result => {
        if (!result) {
          return Promise.reject(
            new errors.NotFound(`No record found for id '${id}'`)
          );
        }
        return this.model.replaceById(id, Object.assign({}, result, data))
          .then(result1 => {
            return Promise.resolve(result1)
              .then(commons.select(params, this.id));
          }).catch(() => {
            return Promise.reject(
              new errors.NotFound(`No record found for id '${id}'`)
            );
          });
      });
  }
  remove(id, params) {
    if (id === null) {
      return this.model.find(this.transformQuery(this.transformQuery(params), {}))
        .then((results) => {
          return this.model.count(this.transformQuery(params, {}).where)
            .then((count) => {
              return this.model.destroyAll(this.transformQuery(params).where)
                .then(() => {
                  return Promise.resolve(results)
                    .then(commons.select(params, this.id))
                    .then((output) => {
                      return Promise.resolve(output);
                    })
                });
            });
        });
    }

    return this.model.findById(id).then(result => {
      if (!result) {
        return Promise.reject(
          new errors.NotFound(`No record found for id '${id}'`)
        );
      }
      return Promise.resolve(result)
        .then(() => {
          return this.model.destroyById(id)
            .then(() => {
              return Promise.resolve(result).then(commons.select(params, this.id));
            });
        });
    });
  }

  whatData(params) {
    return this.model.find(this.transformQuery(params, {}))
  }
}

export default function init(options) {
  debug('Initializing feathers-loopback-connector adapter');
  return new Service(options);
}

init.Service = Service;
