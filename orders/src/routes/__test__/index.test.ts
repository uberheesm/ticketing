import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

const buildTicket = async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();
    return ticket;
};


it('fetches orders for an particular user', async () => {
    // create three tickets for
    const ticketOne = await buildTicket() as any;
    const ticketTwo = await buildTicket() as any;
    const ticketThree = await buildTicket() as any;
    
    const userOne = global.signin();
    const userTwo = global.signin();

    // create one order as user #1
    await request(app)
        .post('/api/orders')
        .set('Cookie', userOne)
        .send({ ticketId: ticketOne.id })
        .expect(201)

    // Destructuring 을 하고 뒤에 콜론을 붙이고 이름을 지정해주면 그 이름으로 값이
    // 지정된다. 즉 rename 하는 것이다. 이렇게 하면 destructuring이랑 renaming을
    // 동시에 할 수 있다.
    // create two orders as user #2
    const { body: orderOne } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({ ticketId: ticketTwo.id })
    .expect(201)

    const { body: orderTwo } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({ ticketId: ticketThree.id })
    .expect(201)

    // make request to get orders for user #2
    const response = await request(app)
        .get('/api/orders')
        .set('Cookie', userTwo)
        .expect(200);

    // make sure we only got the orders for user #2
    expect(response.body.length).toEqual(2);
    expect(response.body[0].id).toEqual(orderOne.id);
    expect(response.body[1].id).toEqual(orderTwo.id);
    expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
    expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});