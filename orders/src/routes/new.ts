import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { NotFoundError, requireAuth, validateRequest, OrderStatus, BadRequestError } from '@lsmticket/common';
import { body } from 'express-validator';
import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

// 원래 expiraion 시간이 15분 즉, 15 x 60 이었으나 너무 길어서 test 하기 위해서 10초로 줄였다.
const EXPIRATION_WINDOW_SECONDS = 30;

// .custom() 메서드는 mongoDB의 형식에 맞게 값이 입력되는지 체크하기 위해서 추가로 validate
// 를 추가한 것이다. 그래서 return 값으로 mongoose.Types.ObjectId.isValid을 이용해서
// mongoose에서 id 값의 유효성을 체크하였다.
// 위의 내용을 적고 난 뒤 약 1주일 뒤에 test 해보니 아래 custom 메서드로 인해서 아래
// await order.save(); 다음 console.log(order);을 하는데 console.log가 작동안된다.
// 아마 여기서 어떤 error가 발생해서 진행을 막고 있어서 일단 해당 내용 주석처리 하였다.
// 그러자 console.log는 작동이 잘 된다.
router.post('/api/orders', requireAuth, [
    body('ticketId')
    .not()
    .isEmpty()
    .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
    .withMessage('TicketId must be provided')
], validateRequest, async (req: Request, res: Response) => {
    const { ticketId } = req.body;

    // Find the ticket the user is trying to order in the database
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        throw new NotFoundError();
    };

    // Make sure that this ticket is not already reserved
    // Run query to look all orders. Find an order where the ticket is the ticket
    // we just found and the orders status is not cancelled. If we find an order
    // from that means the ticket is reserved
    const isReserved = await ticket.isReserved();
    if (isReserved) {
        throw new BadRequestError('Ticket is already reserved');
    };

    // Calculate an experation date for this order
    // Date.prototype.getSeconds(), Date.prototype.setSeconds()
    // 위와 같이 prototype으로 되어 있는 메서드는 instance에서 사용할 수 있는 것들이다.
    // 즉, Date instance의 prototype chain을 타고 올라가면 결국 해당 메서드가 나오기
    // 때문에 빌려서 사용하겠다는 뜻이다.
    // expiration 인스턴스에 getSeconds, setSeconds 메서드를 사용하였기 때문에 메서드의
    // 결과값이 expiration에 기록되어 적용된다.
    // getSecond는 초만 가지고 오는 것이다. 예를 들어서 const a = new Date()의 값이 
    // 1시 22분 33초라고 하면 a.getSeconds() = 33 이다. setSeconds는 초의 값을 지정하는
    // 것인데 약간 주의가 필요한 메서드다. a.setSeconds(44) 라고 하면 시간이 1시 22분 44초
    // 가 된다. 하지만 만약에 a.setSeconds(1000) 이라고 하면 60*16 + 40 = 1000 이므로 16분
    // 40초의 값이다. 그래서 a의 값은 1시 38분 40초가 된다. 이게 간단해 보이는데 인터넷에 이
    // 부분이 제대로 자세히 기록된 내용이 없어서 일일히 다 실험해서 내용을 확인하였다. 가끔씩
    // MDN 공식 자료에서도 제대로 내용을 기록하지 않는 부분이 있어서 실제로 확인해 보는 작업이
    // 필요하다.
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // Build the order and save it to the database
    const order = Order.build({
        userId: req.currentUser!.id,
        status: OrderStatus.Created,
        expiresAt: expiration,
        ticket
    });

    await order.save();

    console.log(`Order = ${order}`);

    // 중요한 것은 new 앞에 await를 절대로 하면 안된다. await를 하면 생성자가 실행된
    // 다음 그 다음 처리가 진행되어야 하는데 await 때문에 계속 대기 상태에서 publish가 안된다.
    // Publish an event saying that an order was created
    new OrderCreatedPublisher(natsWrapper.client).publish({
        id: order.id,
        version: order.version,
        status: order.status,
        userId: order.userId,
        // toISOString()은 주어진 날짜를 국제표준시 기준 ISO 8601 형식으로 표현한 문자열로
        // 변환해준다. YYYY-MM-DDTHH:mm:ss.sssZ 또는 ±YYYYYY-MM-DDTHH:mm:ss.sssZ
        expiresAt: order.expiresAt.toISOString(),
        ticket: {
            id: ticket.id,
            price: ticket.price
        }
    })

    res.status(201).send(order);
});

export { router as newOrderRouter };