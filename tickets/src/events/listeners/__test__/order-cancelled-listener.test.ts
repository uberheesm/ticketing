import { Message } from 'node-nats-streaming';
import mongoose from 'mongoose';
import { OrderCancelledEvent, OrderStatus } from '@lsmticket/common';
import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    const listener = new OrderCancelledListener(natsWrapper.client);

    const orderId = new mongoose.Types.ObjectId().toHexString();

    const ticket = Ticket.build({
        title: 'concert',
        price: 100,
        userId: 'asdf'
    });
    // ticket에 orderId property가 없어서 추가해야 하는데 interface에 정의되어 있지 않다.
    // 그래서 ticket.build로 만들때 orderId를 넣으면 error 가 발생해서 ticket.set으로
    // 생성 후에 property를 추가해주는 방식을 택했다.
    ticket.set({ orderId });

    await ticket.save();

    const data: OrderCancelledEvent['data'] = {
        id: orderId,
        version: 0,
        // status: OrderStatus.Cancelled,
        // userId: 'qwer',
        // expiresAt: 'qwert',
        ticket: {
            id: ticket.id,
        }
    };

    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, ticket, data, orderId, msg };
};

it('updates the ticket , publishes an event, and acks the message', async () => {
    const { listener, ticket, data, orderId, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket!.orderId).not.toBeDefined();

    expect(msg.ack).toHaveBeenCalled();

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});
