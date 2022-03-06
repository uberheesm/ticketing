import { Publisher, OrderCreatedEvent, Subjects } from '@lsmticket/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
    subjects: Subjects.OrderCreated = Subjects.OrderCreated;
}