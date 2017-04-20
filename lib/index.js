'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = init;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var errors = require('feathers-errors');
var makeDebug = require('debug');
var debug = makeDebug('feathers-loopback-connector');
//const error = makeDebug('feathers-loopback-connector:error');
var commons = require('feathers-commons');
// if (!global._babelPolyfill) { require('babel-polyfill'); }

var Service = function () {
  // options;
  // model;

  function Service() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Service);

    this.options = options;
    this.paginate = options.paginate || {};
    this.id = options.id || 'id';
    this.events = options.events || [];
    this.model = options.Model;
  }

  // extend(obj) {
  //     return Proto.extend(obj, this);
  // }

  _createClass(Service, [{
    key: 'parse',
    value: function parse(number) {
      if (typeof number !== 'undefined') {
        return Math.abs(parseInt(number, 10));
      }
    }
  }, {
    key: 'getLimit',
    value: function getLimit(limit, paginate) {
      if (paginate && paginate.default) {
        var lower = typeof limit === 'number' ? limit : paginate.default;
        var upper = typeof paginate.max === 'number' ? paginate.max : Number.MAX_VALUE;
        return Math.min(lower, upper);
      }
      return limit;
    }
  }, {
    key: 'transformQuery',
    value: function transformQuery(queryParams, paginate) {
      var query = JSON.parse(JSON.stringify(queryParams));
      var newQuery = {};
      if (query.query) {
        if (paginate) {
          debug('Paginate', paginate);
          newQuery.limit = paginate.default;
        }
        if (query.query.$sort) {
          var sorts = [];
          for (var i in query.query.$sort) {
            if (query.query.$sort[i] === 1 || query.query.$sort[i] === '1') {
              sorts.push(i + ' ASC');
            }
            if (query.query.$sort[i] === -1 || query.query.$sort[i] === '-1') {
              sorts.push(i + ' DESC');
            }
          }
          newQuery.order = sorts;
          delete query.query.$sort;
        }
        if (query.query.$select) {
          var select = {};
          query.query.$select.forEach(function (item) {
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
        var replaced = JSON.stringify(query.query).replace(/\$in/g, 'inq').replace(/\$nin/g, 'nin').replace(/\$lt/g, 'lt').replace(/\$lte/g, 'lte').replace(/\$gt/g, 'gt').replace(/\$gte/g, 'gte').replace(/\$ne/g, 'neq').replace(/\$or/g, 'or').replace(/\$and/g, 'and').replace(/\$between/g, 'between').replace(/\$inq/g, 'inq').replace(/\$like/g, 'like').replace(/\$nlike/g, 'nlike').replace(/\$ilike/g, 'ilike').replace(/\$nilike/g, 'nilike').replace(/\$regexp/g, 'regexp').replace(/\$near/g, 'near').replace(/\$maxDistance/g, 'maxDistance').replace(/\$minDistance/g, 'minDistance').replace(/\$unit/g, 'unit');
        newQuery.where = JSON.parse(replaced);
        debug('New Query', newQuery);
        return newQuery;
      }
      return queryParams;
    }
  }, {
    key: 'find',
    value: function find(params) {
      var _this = this;

      var paginate = params && typeof params.paginate !== 'undefined' ? params.paginate : this.paginate;
      params.query = params.query || {};
      if (!paginate.default) {
        return this.model.find(this.transformQuery(params, paginate));
      }
      return this.model.find(this.transformQuery(params, paginate)).then(function (results) {
        return _this.model.count(_this.transformQuery(params, paginate).where).then(function (count) {
          return Promise.resolve({
            total: count,
            limit: _this.getLimit(_this.parse(params.query.$limit), paginate),
            skip: params.query.$skip ? params.query.$skip : 0,
            data: results
          });
        });
      });
    }
  }, {
    key: 'get',
    value: function get(id, params) {
      var _this2 = this;

      return this.model.findById(id).then(function (result) {
        if (!result) {
          return Promise.reject(new errors.NotFound('No record found for id \'' + id + '\''));
        }
        return Promise.resolve(result).then(commons.select(params, _this2.id));
      });
    }
  }, {
    key: 'create',
    value: function create(data, params) {
      if (data instanceof Array) {
        return this.model.create(data);
      } else {
        return this.model.create(data).then(commons.select(params, this.id));
      }
    }
  }, {
    key: 'update',
    value: function update(id, data, params) {
      var _this3 = this;

      if (Array.isArray(data) || id === null) {
        return Promise.reject(new errors.BadRequest('Not replacing multiple records. Did you mean `patch`?'));
      }

      return this.model.replaceById(id, data).then(function (result) {
        return Promise.resolve(result).then(commons.select(params, _this3.id));
      }).catch(function () {
        return Promise.reject(new errors.NotFound('No record found for id \'' + id + '\''));
      });
    }
  }, {
    key: 'patch',
    value: function patch(id, data, params) {
      var _this4 = this;

      if (id === null) {
        return this.model.updateAll(this.transformQuery(params).where, data).then(function (result) {
          params.query = data;
          return _this4.whatData(_this4.transformQuery(params)).then(function (res) {
            return Promise.resolve(res);
          });
        });
      }
      return this.model.findById(id).then(function (result) {
        if (!result) {
          return Promise.reject(new errors.NotFound('No record found for id \'' + id + '\''));
        }
        return _this4.model.replaceById(id, Object.assign({}, result, data)).then(function (result1) {
          return Promise.resolve(result1).then(commons.select(params, _this4.id));
        }).catch(function () {
          return Promise.reject(new errors.NotFound('No record found for id \'' + id + '\''));
        });
      });
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var _this5 = this;

      if (id === null) {
        return this.model.find(this.transformQuery(this.transformQuery(params), {})).then(function (results) {
          return _this5.model.count(_this5.transformQuery(params, {}).where).then(function (count) {
            return _this5.model.destroyAll(_this5.transformQuery(params).where).then(function () {
              return Promise.resolve(results).then(commons.select(params, _this5.id)).then(function (output) {
                return Promise.resolve(output);
              });
            });
          });
        });
      }

      return this.model.findById(id).then(function (result) {
        if (!result) {
          return Promise.reject(new errors.NotFound('No record found for id \'' + id + '\''));
        }
        return Promise.resolve(result).then(function () {
          return _this5.model.destroyById(id).then(function () {
            return Promise.resolve(result).then(commons.select(params, _this5.id));
          });
        });
      });
    }
  }, {
    key: 'whatData',
    value: function whatData(params) {
      return this.model.find(this.transformQuery(params, {}));
    }
  }]);

  return Service;
}();

function init(options) {
  debug('Initializing feathers-loopback-connector adapter');
  return new Service(options);
}

init.Service = Service;
module.exports = exports['default'];