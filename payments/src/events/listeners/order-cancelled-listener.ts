import { Message } from 'node-nats-streaming';
import { OrderCancelledEvent, Subjects, Listener, OrderStatus } from "@lsmticket/common";
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';


export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    subjects: Subjects.OrderCancelled = Subjects.OrderCancelled

    queueGroupName = queueGroupName;

    // version: data.version - 1 인 이유는 바로 직전의 버전이 존재해야 concurrency issue
    // 문제가 없기 때문에 확인차 하는 것이다.
    async onMessage (data: OrderCancelledEvent['data'], msg: Message): Promise<void> {
        // const order = await Order.findOne() 에서 await의 존재가 매우 중요하다. 만약
        // await를 하지 않으면 이후 await가 들어간 모든 문장에서 Error가 발생한다. 왜냐하면
        // Promise 객체를 반환해야만 뒤 await가 읽을 수 있기 때문이다. 
        const order = await Order.findOne({
            _id: data.id,
            version: data.version - 1,
        });

        if (!order) {
            throw new Error('Order not found');
        }

        order.set({ status: OrderStatus.Cancelled });
        await order.save();

        msg.ack();
    }
}