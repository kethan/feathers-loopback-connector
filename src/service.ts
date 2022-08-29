import { NotFound, BadRequest } from '@feathersjs/errors'
import {
    AdapterBase,
    AdapterServiceOptions,
    PaginationOptions,
    PaginationParams,
    AdapterParams,
    AdapterQuery
} from '@feathersjs/adapter-commons'
import { NullableId, Id, Params, ServiceMethods, Paginated } from '@feathersjs/feathers'
import _ from 'lodash';
// @ts-ignore
import { coerceQueryToLoopbackFilter, getLimit, parse } from './utils';

function pick(source: any, ...keys: any) {
    return keys.reduce((result: any, key: any) => {
        if (source[key] !== undefined) {
            result[key] = source[key];
        }
        return result;
    }, {});
}
function select(params: any, ...otherFields: any) {
    const fields = params && params.query && params.query.$select;

    if (Array.isArray(fields) && otherFields.length) {
        fields.push(...otherFields);
    }

    const convert = (result: any) => {
        if (!Array.isArray(fields)) {
            return result;
        }

        return pick(result, ...fields);
    };

    return (result: any) => {
        if (Array.isArray(result)) {
            return result.map(convert);
        }

        return convert(result);
    };
};

export interface LoopBackServiceOptions extends AdapterServiceOptions {
    model?: any;
}

export interface LoopBackAdapterParams<Q = AdapterQuery>
    extends AdapterParams<Q, Partial<LoopBackServiceOptions>> {
    $include: string[];
}

export class LoopBackAdapter<T = any, D = Partial<T>, P extends Params = LoopBackAdapterParams> extends AdapterBase<
    T,
    D,
    P,
    LoopBackServiceOptions
> {
    constructor(options: LoopBackServiceOptions) {
        super({
            id: options.id,
            filters: {
                $include: true
            },
            ...options
        });
    }

    parse(number: string) {
        return Math.abs(parseInt(number, 10));
    }

    getLimit(limit: number, paginate: PaginationParams) {
        if (paginate && paginate.default) {
            const lower = typeof limit === 'number' ? limit : paginate.default;
            const upper = typeof paginate.max === 'number' ? paginate.max : Number.MAX_VALUE;
            return Math.min(lower, upper);
        }
        return limit;
    }

    transformQuery(params: P, paginate: PaginationParams = {}) {
        let query: any = {};
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

    getQuery(params: P) {
        const { $skip, $sort, $limit, $select, ...query } = params.query || {}

        return {
            query,
            filters: { $skip, $sort, $limit, $select }
        }
    }

    async $find(_params?: P & { paginate?: PaginationOptions }): Promise<Paginated<T>>
    async $find(_params?: P & { paginate: false }): Promise<T[]>
    async $find(_params?: P): Promise<Paginated<T> | T[]>
    async $find(params: P = {} as P): Promise<Paginated<T> | T[]> {
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

    async $get(id: Id, params?: P | undefined): Promise<T> {
        const filter = this.transformQuery(params!);
        const select1 = select(params, this.id);
        return this.options.model.findById(id, filter)
            .then((result: T) => {
                if (!result) {
                    return Promise.reject(
                        new NotFound(`No record found for id '${id}'`)
                    );
                }

                return result;
            })
            .then(select1);
    }
    async $create(data: Partial<D>, params?: P): Promise<T>
    async $create(data: Partial<D>[], params?: P): Promise<T[]>
    async $create(data: Partial<D> | Partial<D>[], _params?: P): Promise<T | T[]>
    async $create(data: Partial<D> | Partial<D>[], params: P = {} as P): Promise<T | T[]> {
        const select1 = select(params, this.id);
        if (data instanceof Array) {
            return this.options.model.create(data);
        } else {
            return this.options.model.create(data)
                .then(select1);
        }
    }

    async $update(id: Id, data: D, params?: P | undefined): Promise<T> {
        const select1 = select(params, this.id);
        if (Array.isArray(data) || id === null) {
            return Promise.reject(new BadRequest('Not replacing multiple records. Did you mean `patch`?'));
        }
        // @ts-ignore
        delete data.id;
        return this.options.model.replaceById(id, data)
            .then(select1)
            .catch(() => {
                return Promise.reject(
                    new NotFound(`No record found for id '${id}'`)
                );
            });
    }
    async $patch(id: null, data: Partial<D>, params?: P): Promise<T[]>
    async $patch(id: Id, data: Partial<D>, params?: P): Promise<T>
    async $patch(id: NullableId, data: Partial<D>, _params?: P): Promise<T | T[]>
    async $patch(id: NullableId, data: Partial<D>, params: P = {} as P): Promise<T | T[]> {
        const filter = this.transformQuery(params);
        const select1 = select(params, this.id);
        if (id === null) {
            let ids: any[];
            return this.options.model.find({ where: filter.where, fields: [this.id] })
                .then((results: T[]) => {
                    ids = results.map((item: any) => item[this.id]);
                    return this.options.model.updateAll(filter.where, data);
                })
                .then(() => this.options.model.find({ where: { [this.id]: { inq: ids } } }))
                .then(select1);
        }
        return this.options.model.findById(id)
            .then((result: any) => {
                if (!result) {
                    return Promise.reject(
                        new NotFound(`No record found for id '${id}'`)
                    );
                }
                return result.updateAttributes(data);
            })
            .then(select1)
            .catch(() => {
                return Promise.reject(
                    new NotFound(`No record found for id '${id}'`)
                );
            });
    }

    async $remove(id: null, params?: P): Promise<T[]>
    async $remove(id: Id, params?: P): Promise<T>
    async $remove(id: NullableId, _params?: P): Promise<T | T[]>
    async $remove(id: NullableId, params: P = {} as P): Promise<T | T[]> {
        const filter = this.transformQuery(params);
        const select1 = select(params, this.id);
        if (id === null) {
            return this.options.model.find(filter)
                .then((results: T[]) => {
                    return this.options.model.destroyAll(filter.where || {})
                        .then(() => select1(results));
                });
        }

        return this.options.model.findById(id).then((result: T) => {
            if (!result) {
                return Promise.reject(
                    new NotFound(`No record found for id '${id}'`)
                );
            }
            return this.options.model.destroyById(id)
                .then(() => select1(result));
        });
    }
}

export class LoopBackService<T = any, D = Partial<T>, P extends LoopBackAdapterParams = LoopBackAdapterParams>

    extends LoopBackAdapter<T, D, P>
    implements ServiceMethods<T | Paginated<T>, D, P>
{
    async find(params?: P & { paginate?: PaginationOptions }): Promise<Paginated<T>>
    async find(params?: P & { paginate: false }): Promise<T[]>
    async find(params?: P): Promise<Paginated<T> | T[]>
    async find(params?: P): Promise<Paginated<T> | T[]> {
        return this._find(params) as any
    }

    async get(id: Id, params?: P): Promise<T> {
        return this._get(id, params) as any
    }
    async create(data: Partial<D>, params?: P): Promise<T>
    async create(data: Partial<D>[], params?: P): Promise<T[]>
    async create(data: Partial<D> | Partial<D>[], params?: P): Promise<T | T[]> {
        return this._create(data, params) as any
    }
    async update(id: Id, data: D, params?: P): Promise<T> {
        return this._update(id, data, params) as any;
    }
    async patch(id: Id, data: Partial<D>, params?: P): Promise<T>
    async patch(id: null, data: Partial<D>, params?: P): Promise<T[]>
    async patch(id: NullableId, data: Partial<D>, params?: P): Promise<T | T[]> {
        return this._patch(id, data, params);
    }
    async remove(id: Id, params?: P): Promise<T>
    async remove(id: null, params?: P): Promise<T[]>
    async remove(id: NullableId, params?: P): Promise<T | T[]> {
        return this._remove(id, params);
    }
}