import { Message } from 'node-nats-streaming';
import { Listener, OrderCancelledEvent, Subjects } from '@lsmticket/common';
import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    subjects: Subjects.OrderCancelled = Subjects.OrderCancelled;
    queueGroupName = queueGroupName;

    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        const ticket = await Ticket.findById(data.ticket.id);

        if (!ticket) {
            throw new Error('Ticket not found');
        };

        // null 대신 undefined을 쓰는 이유는 typescript의 type check 기능이 null
        // 에서는 시나리오에 따라 작동하지 않는 경우가 있어서 보다 범용성 있게 
        // 사용할 수 있는 undefined을 사용한다
        ticket.set({ orderId: undefined });

        await ticket.save();

        new TicketUpdatedPublisher(this.client).publish({
            id: ticket.id,
            price: ticket.price,
            title: ticket.title,
            userId: ticket.userId,
            orderId: ticket.orderId,
            version: ticket.version,
        });

        msg.ack();
    }
}
