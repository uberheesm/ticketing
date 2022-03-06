import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('fetches the order', async () => {
    // create a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20

    });
    await ticket.save();

    const user = global.signin();
    // Destructuring 을 하고 뒤에 콜론을 붙이고 이름을 지정해주면 그 이름으로 값이
    // 지정된다. 즉 rename 하는 것이다. 이렇게 하면 destructuring이랑 renaming을
    // 동시에 할 수 있다.
    // make a request to build an order with this ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(201);

    // make request to fetch the order
    const { body: fetchedOrder } = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Cookie', user)
        .send()
        .expect(200);

    expect(fetchedOrder.id).toEqual(order.id);
});

it('returns an error if one user tries to fetch another users order', async () => {
    // create a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20

    });
    await ticket.save();

    const user1 = global.signin();
    const user2 = global.signin();
    // Destructuring 을 하고 뒤에 콜론을 붙이고 이름을 지정해주면 그 이름으로 값이
    // 지정된다. 즉 rename 하는 것이다. 이렇게 하면 destructuring이랑 renaming을
    // 동시에 할 수 있다.
    // make a request to build an order with this ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user1)
        .send({ ticketId: ticket.id })
        .expect(201);

    // make request to fetch the order
    await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Cookie', user2)
        .send()
        .expect(401);
});
