import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketCreatedEvent } from '@lsmticket/common';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    subjects: Subjects.TicketCreated = Subjects.TicketCreated;
    queueGroupName: string = queueGroupName;
    async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
        const { id, title, price } = data;
        const ticket = Ticket.build({
            id, title, price
        });
        await ticket.save();

        console.log(`TicketCreatedListener = ${ticket}`);

        // 아래 ack()는 메세지를 제대로 받았다고 알려주는 것이다.
        msg.ack();
    }
}