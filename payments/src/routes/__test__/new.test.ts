import request from 'supertest';
import mongoose from 'mongoose';
import { OrderStatus } from '@lsmticket/common';
import { app } from '../../app';
import { Order } from '../../models/order';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

// jest로 mock를 생성하는 것은 계속해서 에러가 나는데 강사가 만든 코드로는 부족하고
// stripe에서 필요로 하는 객체와 함수의 mock을 추가로 만들어줘야 제대로 작동할 것 
// 같은데 문제는 mock 관련해서 공부하는 것을 따로 해줘야 할 정도로 생소한 것이라서
// 일단 mock을 하지 않고 일단은 test key를 이용하여 test 하는 것으로 한다.
// 추가로 stripe api 관련해서도 구조를 빠삭하게 알아야 mock을 만들 수 있는데 이것
// 역시 시간이 많이 걸려서 일단은 보류한다.
// jest.mock('../../stripe', () => {
//     return { __esModule: true };
// });

it('returns a 404 when purchasing ans order that does not exist', async () => {
    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin())
        .send({
            token: 'asdf',
            orderId: new mongoose.Types.ObjectId().toHexString()
        })
        .expect(404)
});

it('returns a 401 when purchasing an order that doesnt belong to the user', async () => {
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
        price: 20,
        status: OrderStatus.Created,
    });
    await order.save();

    await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
        token: 'asdf',
        orderId: order.id
    })
    .expect(401)
});

it('returns a 400 when purchasing a cancelled order', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();

    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId,
        version: 0,
        price: 20,
        status: OrderStatus.Cancelled,
    });
    await order.save();

    // 이번 test의 global.signi은 /payments/test/setup.ts 에 정의되어 있는데
    // 원래 다른 서버에는 인자를 넣는 옵션이 없었는데 미리 정의된 id를 인자로 넣기
    // 위해서 메서드를 바꾸었다. 상세 내용은 해당 파일 확인 요망.
    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin(userId))
        .send({
            orderId: order.id,
            token: 'zxcv'
        })
        .expect(400)
});

// 아래 test를 git action이라고 git hub의 ci test tool에 cloud 식으로 올려서 하는 방식이
// 있는데 그것을 하면 nats-screaming server안의 publish의 type이 undefiend되었다고 에러가
// 난다. nats는 완성된 프로그램인데 type이 undefined되었다는 것은 말이 안된다. local에서도
// 동일 에러가 발생하는데 아마 mock을 쓰지 않고 실제 natsWrapper.client를 불러서 test하기
// 때문에 발생하는 에러라고 짐작할 뿐이다. 물론 jest말고 local에서 서버돌리고 데이터 입력해서
// stripe 실행을 test하면 너무 잘된다. 그래서 일단은 jest 및 ci 단계에서 에러가 나는것은
// 건너뛰고 deploy 단계로 넘어간다.
it('returns a 201 with valid inputs', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    // Math.random()은 랜덤한 자연수를 생성하는 것이 아니라 랜덤한 0에서 1사이의
    // 숫자를 생성한다. 그래서 1000을 곱하지 않으면 Stripe에서 무조건 에러발생
    // 한다. Stripe값은 자연수만 된다.
    // 1000을 곱하니 payment 를 mongoDB에 저장하는 코드 만들기 전까지는 잘 되다가
    // payment를 DB에 저장하니 갑자기 값이 너무 적어서 Error가 발생한다고 console
    // 에 찍힌다. 그래서 100000으로 수정했다.
    const price = Math.floor(Math.random() * 100000);
    const order = Order.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        userId,
        version: 0,
        price,
        status: OrderStatus.Created,
    });
    await order.save();

    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin(userId))
        .send({
            orderId: order.id,
            token: 'tok_visa',
        })
        .expect(201);

    const stripeCharges = await stripe.charges.list({ limit: 50 });
    const stripeCharge = stripeCharges.data.find((charge) => {
        return charge.amount === price;
    });

    expect(stripeCharge).toBeDefined();
    expect(stripeCharge!.currency).toEqual('usd');

    const payment = await Payment.findOne({
        orderId: order.id,
        stripeId: stripeCharge!.id
    });

    expect(payment).not.toBeNull();

    // const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
    // expect(chargeOptions.source).toEqual('tok_visa');
    // expect(chargeOptions.amount).toEqual(20);
    // expect(chargeOptions.currency).toEqual('usd');
});