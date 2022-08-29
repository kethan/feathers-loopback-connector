import { feathers } from '@feathersjs/feathers'
// @ts-ignore
import express, { json, urlencoded, rest } from '@feathersjs/express'
import { LoopBackService } from '../src/service';

// import loopbackConnector from 'feathers-loopback-connector';
import { DataSource } from 'loopback-datasource-juggler';

// const db = knex({
//     client: 'pg',
//     connection: "postgresql://postgres:fldfaKtL8Z7RndidtqhU@containers-us-west-75.railway.app:7613/railway",
// });

const ds = new DataSource({
    connector: 'loopback-connector-mongodb',
    // connector: require('loopback-connector-postgresql'),
    url: ""

});

// const messages = new MemoryService({
//     model: ds,
//     // name: 'messages',
//     paginate: {
//         default: 10,
//         max: 100
//     }
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
// Turn on URL-encoded parser for REST services
app.use(urlencoded({ extended: true }))
// Set up REST transport
app.configure(rest());

var MessageSchema = ds.createModel('messages', {
    id: { type: Number },
    text: { type: String }
});

app.use('messages', new LoopBackService({
    id: "_id",
    multi: true,
    model: ds,
    // name: 'messages',
    paginate: {
        default: 10,
        max: 100
    }
}));

app
    .listen(3000)
    .then(() => console.log('Feathers server listening on localhost:3000'))