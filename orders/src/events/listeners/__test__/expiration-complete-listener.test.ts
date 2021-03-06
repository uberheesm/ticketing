import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { OrderStatus, ExpirationCompleteEvent } from '@lsmticket/common';
import { ExpirationComplteListener } from "../expiration-complete-listener";
import { natsWrapper } from "../../..//nats-wrapper";
import { Ticket } from '../../../models/ticket';
import { Order } from '../../../models/order';


const setup = async () => {
    const listener = new ExpirationComplteListener(natsWrapper.client);

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 100
    });
    await ticket.save();

    const order = Order.build({
        status: OrderStatus.Created,
        userId: 'asdf',
        expiresAt: new Date(),
        ticket
    });
    await order.save();

    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id,
    };

    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, data, order, ticket, msg };
};

it('updates the order status to canceled', async () => {
    const { listener, data, order, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emit an OrderCancelled event', async () => {
    const { listener, data, order, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

    expect(eventData.id).toEqual(order.id);
});

it('ack the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});