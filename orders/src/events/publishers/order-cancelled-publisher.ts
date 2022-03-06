import { Publisher, OrderCancelledEvent, Subjects } from '@lsmticket/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    subjects: Subjects.OrderCancelled = Subjects.OrderCancelled
}