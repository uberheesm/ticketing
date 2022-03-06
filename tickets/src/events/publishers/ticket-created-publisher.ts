import { Publisher, Subjects, TicketCreatedEvent } from '@lsmticket/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    subjects: Subjects.TicketCreated = Subjects.TicketCreated;
}