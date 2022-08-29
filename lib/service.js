import { NotFound, BadRequest } from '@feathersjs/errors';
import { AdapterBase } from '@feathersjs/adapter-commons';
import _ from 'lodash';
// @ts-ignore
import { coerceQueryToLoopbackFilter, getLimit, parse } from './utils';
function pick(source, ...keys) {
    return keys.reduce((result, key) => {
        if (source[key] !== undefined) {
            result[key] = source[key];
        }
        return result;
    }, {});
}
function select(params, ...otherFields) {
    const fields = params && params.query && params.query.$select;
    if (Array.isArray(fields) && otherFields.length) {
        fields.push(...otherFields);
    }
    const convert = (result) => {
        if (!Array.isArray(fields)) {
            return result;
        }
        return pick(result, ...fields);
    };
    return (result) => {
        if (Array.isArray(result)) {
            return result.map(convert);
        }
        return convert(result);
    };
}
;
export class LoopBackAdapter extends AdapterBase {
    constructor(options) {
        super({
            id: options.id,
            filters: {
                $include: true
            },
            ...options
        });
    }
    parse(number) {
        return Math.abs(parseInt(number, 10));
    }
    getLimit(limit, paginate) {
        if (paginate && paginate.default) {
            const lower = typeof limit === 'number' ? limit : paginate.default;
            const upper = typeof paginate.max === 'number' ? paginate.max : Number.MAX_VALUE;
            return Math.min(lower, upper);
        }
        return limit;
    }
    transformQuery(params, paginate = {}) {
        let query = {};
        if (params.query) {
            query = coerceQueryToLoopbackFilter(params.query, this.id);
            query.limit = getLimit(query.limit, paginate);
            if (_.isUndefined(query.limit)) {
                delete query.limit;
            }
            return query;
        }
        return params;
    }
    getQuery(params) {
        const { $skip, $sort, $limit, $select, ...query } = params.query || {};
        return {
            query,
            filters: { $skip, $sort, $limit, $select }
        };
    }
    async $find(params = {}) {
        const { paginate } = this.getOptions(params);
        // @ts-ignore
        params.query = params.query || {};
        const filter = this.transformQuery(params, paginate);
        const getResults = () => filter.limit === 0 ? Promise.resolve([]) : this.options.model.find(filter);
        if (!(paginate && paginate.default)) {
            return getResults();
        }
        // @ts-ignore
        return Promise.all([this.options.model.count(filter.where), getResults()])
            .then(([count, results]) => ({
            total: count,
            skip: params.query?.$skip ? parse(params.query.$skip) : 0,
            limit: getLimit(params.query?.$limit, paginate),
            data: results
        }));
    }
    async $get(id, params) {
        const filter = this.transformQuery(params);
        const select1 = select(params, this.id);
        return this.options.model.findById(id, filter)
            .then((result) => {
            if (!result) {
                return Promise.reject(new NotFound(`No record found for id '${id}'`));
            }
            return result;
        })
            .then(select1);
    }
    async $create(data, params = {}) {
        const select1 = select(params, this.id);
        if (data instanceof Array) {
            return this.options.model.create(data);
        }
        else {
            return this.options.model.create(data)
                .then(select1);
        }
    }
    async $update(id, data, params) {
        const select1 = select(params, this.id);
        if (Array.isArray(data) || id === null) {
            return Promise.reject(new BadRequest('Not replacing multiple records. Did you mean `patch`?'));
        }
        // @ts-ignore
        delete data.id;
        return this.options.model.replaceById(id, data)
            .then(select1)
            .catch(() => {
            return Promise.reject(new NotFound(`No record found for id '${id}'`));
        });
    }
    async $patch(id, data, params = {}) {
        const filter = this.transformQuery(params);
        const select1 = select(params, this.id);
        if (id === null) {
            let ids;
            return this.options.model.find({ where: filter.where, fields: [this.id] })
                .then((results) => {
                ids = results.map((item) => item[this.id]);
                return this.options.model.updateAll(filter.where, data);
            })
                .then(() => this.options.model.find({ where: { [this.id]: { inq: ids } } }))
                .then(select1);
        }
        return this.options.model.findById(id)
            .then((result) => {
            if (!result) {
                return Promise.reject(new NotFound(`No record found for id '${id}'`));
            }
            return result.updateAttributes(data);
        })
            .then(select1)
            .catch(() => {
            return Promise.reject(new NotFound(`No record found for id '${id}'`));
        });
    }
    async $remove(id, params = {}) {
        const filter = this.transformQuery(params);
        const select1 = select(params, this.id);
        if (id === null) {
            return this.options.model.find(filter)
                .then((results) => {
                return this.options.model.destroyAll(filter.where || {})
                    .then(() => select1(results));
            });
        }
        return this.options.model.findById(id).then((result) => {
            if (!result) {
                return Promise.reject(new NotFound(`No record found for id '${id}'`));
            }
            return this.options.model.destroyById(id)
                .then(() => select1(result));
        });
    }
}
export class LoopBackService extends LoopBackAdapter {
    async find(params) {
        return this._find(params);
    }
    async get(id, params) {
        return this._get(id, params);
    }
    async create(data, params) {
        return this._create(data, params);
    }
    async update(id, data, params) {
        return this._update(id, data, params);
    }
    async patch(id, data, params) {
        return this._patch(id, data, params);
    }
    async remove(id, params) {
        return this._remove(id, params);
    }
}
