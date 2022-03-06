import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest, NotFoundError, requireAuth, NotAuthorizedError, BadRequestError } from '@lsmticket/common';
import { Ticket } from '../models/ticket';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put('/api/tickets/:id', 
    requireAuth, 
    [
        body('title')
            .not()
            .isEmpty()
            .withMessage('Title is required'),
        body('price')
            .isFloat({ gt: 0 })
            .withMessage('Price must be provided and greater than zero')
    ], 
    validateRequest, 
    async (req: Request, res: Response) => {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            throw new NotFoundError();
        };

        if (ticket.orderId) {
            throw new BadRequestError('Cannot edit a reserved ticket');
        };

        if (ticket.userId !== req.currentUser!.id) {
            throw new NotAuthorizedError();
        };

        // 아래 ticket.set 및 ticket.save은 mongoose document에 작용하는 method이다.
        // 위의 router.put은 express의 method이다. 즉, express와 mongoose의 code가 
        // 섞여 있어서 두개를 함께 쓰기 때문에 헷갈리지 않고 잘 구분해서 쓰는 것이 중요하다.
        ticket.set({
            title: req.body.title,
            price: req.body.price
        });

        await ticket.save();

        await new TicketUpdatedPublisher(natsWrapper.client).publish({
            id: ticket.id,
            version: ticket.version,
            title: ticket.title,
            price: ticket.price,
            userId: ticket.userId
        });

        res.send(ticket);
});

export { router as updateTicketRouter };