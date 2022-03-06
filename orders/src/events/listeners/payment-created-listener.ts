import { Subjects, Listener, PaymentCreatedEvent, OrderStatus } from '@lsmticket/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
    subjects: Subjects.PaymentCreated = Subjects.PaymentCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: PaymentCreatedEvent['data'], msg: Message): Promise<void> {
        const order = await Order.findById(data.orderId);

        if (!order) {
            throw new Error('Order not found');
        };

        if (order.status === OrderStatus.Complete) {
            return msg.ack();
        }

        order.set({ status: OrderStatus.Complete })
        await order.save();

        msg.ack();
    }

}