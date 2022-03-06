import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketUpdatedEvent } from '@lsmticket/common';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
    subjects: Subjects.TicketUpdated = Subjects.TicketUpdated;
    queueGroupName: string = queueGroupName;

    // Ticket.findOne 에서 version: data.version - 1 을 쓴 이유는 version이 자연수 1만큼
    // 증가해야 하며 중간에 빈숫자가 있어서는 안된다. 예를 들어 1,2,3,4... 이런 식으로 가야지
    // 1,2,4,5.. 와 같이 중간에 3이 빠지면 안된다는 것이다. 그래서 항상 listener가 메세지를
    // 받으면 id를 확인하면서 바로 이전 버전이 있었는지 data.version - 1로 함께 확인함으로써
    // 바로 이전 version이 존재하는지 확인하고 중간에 하나도 빠지지 않고 연속되도록 관리한다.
    async onMessage(data: TicketUpdatedEvent['data'], msg: Message): Promise<void> {
        const ticket = await Ticket.findByEvent(data);

        if (!ticket) {
            throw new Error('Ticket not found');
        };

        // 아래 두줄 코드는 mongoose-update-if-current 모듈없이 그 모듈의 코드를 직점 만들어서
        // 시스템에 적용시키려는 연습코드이다. mongoose-update-if-current이 있을 때와는 다르게
        // data에서 version을 추가로 뽑아내어 ticket.set으로 ticket document에 적용한다.
        // 참고로 들어오는 data argument에 이미 version이 1 더해진 상태이다. 왜냐하면 ticket
        // 이 생성되는 것은 tickets 서버인데 여기에도 mongoose-update-if-current 모듈이 적용
        // 되어 있기 때문에 version이 자동 적용 된다.
        // const { title, price, version } = data;
        // ticket.set({ title, price, version });

        const { title, price } = data;
        ticket.set({ title, price });
        await ticket.save();

        msg.ack();
    }
}