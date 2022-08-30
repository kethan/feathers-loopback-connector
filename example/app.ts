import { feathers } from '@feathersjs/feathers'
import express, { json, urlencoded, rest } from '@feathersjs/express'
import { LoopBackService } from '../src/service';
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