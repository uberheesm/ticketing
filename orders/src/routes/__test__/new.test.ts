import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

// 이런 종류의 test가 중요한 이유는 마이크로서비스에서는 서비스별로 서버가 분리되어 있기
// 때문에 자기가 작성한 코드가 문제 없는지를 확인 할 수 있는 방법이 기존대로 postman을 
// 사용한다면 만드는 도중에는 테스트 불가능하고 각 서비스를 거의 다 만든 다음에 통합
// 테스트 하는 방식밖에 없다. 그래서 중간에 테스트를 하기 위해서는 jest로 아래와 같이 
// 할때마다 테스트 하는 방식이 필수적이다.

it('returns an error if the ticket does not exist', async () => {
    const ticketId = new mongoose.Types.ObjectId();

    await request(app)
        .post('./api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId })
        .expect(404);
});

it('returns an error if the ticket is already reserved', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const order = Order.build({
        ticket,
        userId: 'mike',
        status: OrderStatus.Created,
        expiresAt: new Date()
    });
    await order.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId: ticket.id })
        .expect(400)
});

it('reserves a ticket', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();
    
    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId: ticket.id })
        .expect(201)
});

it('emit an order created event', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();
    
    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId: ticket.id })
        .expect(201)

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});