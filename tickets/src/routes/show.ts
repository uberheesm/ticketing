import express, { Request, Response } from 'express';
import { NotFoundError } from '@lsmticket/common';
import { Ticket } from '../models/ticket';

const router = express.Router();

router.get('/api/tickets/:id', async (req: Request, res: Response) => {
    // req.params.id 에서 id는 /api/tickets/:id에서 :id이다. 
    const ticket = await Ticket.findById(req.params.id);

    if(!ticket) {
        throw new NotFoundError();
    };

    res.send(ticket);
});

export { router as showTicketRouter };