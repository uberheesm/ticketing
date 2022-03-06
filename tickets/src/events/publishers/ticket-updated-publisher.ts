import { Publisher, Subjects, TicketUpdatedEvent } from '@lsmticket/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    subjects: Subjects.TicketUpdated = Subjects.TicketUpdated;
}