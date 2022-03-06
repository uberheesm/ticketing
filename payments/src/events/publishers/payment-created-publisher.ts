import { Subjects, Publisher, PaymentCreatedEvent } from '@lsmticket/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
    subjects: Subjects.PaymentCreated = Subjects.PaymentCreated;
}