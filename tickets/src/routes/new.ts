import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest } from '@lsmticket/common';
import { Ticket } from '../models/ticket';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post('/api/tickets', requireAuth, [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0')
], validateRequest, async (req: Request, res: Response) => {
    const { title, price } = req.body;

    const ticket = Ticket.build({
    title, 
    price,
    userId: req.currentUser!.id
    });

    console.log(`NewTicketRouter = ${ticket}`);
    
    await ticket.save();
    // 아래 TicketCreatedPublisher에서 ticket.id, ticket.title등 req.body에서 가져 오지 않고 
    // ticket에서 value를 가져오는 이유는 만약의 경우 값이 다를 수가 있어서 db와 반드시 동일한
    // 값을 가지고 있어야 하기 때문이다.
    // 추가로 중요한 내용은 new 앞에 await를 절대로 하면 안된다. await를 하면 생성자가 실행된
    // 다음 그 다음 처리가 진행되어야 하는데 await 때문에 계속 대기 상태에서 publish가 안된다.
    // 하나 더 추가하면, version: ticket.version 이라는 구문에서 ticket.version은 mongoose에서
    // 제공하는 것이 아니라 mongoose에 추가로 library를 깔아서 plugin 형식으로 추가해야 하는 것
    // 이다. 그 library이름은 mongoose-update-if-current이고 concurrancy issue 때문에 version
    // property를 추가해서 mongoDB에 넣어주고 version을 관리해주는 module이다.
    // 주의할 점은 version의 경우 order 생성, 삭제, 변경 & ticket 생성, 삭제, 변경등 중요한 event
    // 에 붙이고 중요하지 않은 side event는 그냥 version 없이 한다. 왜냐하면 모든 event에 version
    // 을 다 붙이면 code가 너무 많아서 복잡해지기 때문이다.
   new TicketCreatedPublisher(natsWrapper.client).publish({
        id: ticket._id,
        version: ticket.version,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId
    });

    res.status(201).send(ticket);
});

export { router as createTicketRouter };