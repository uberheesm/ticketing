import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

it('returns a 404 if the ticket is not found', async () => {
    // 아래에서 mongoose에서 생성된 id는 string이 아니기 때문에 toHexString을 사용하여 형태를 
    // 변환해야 한다. 해당 내용은 mongoDB의 ObjectId()부분에 설명되어 있으니 검색요망.
    const id = new mongoose.Types.ObjectId().toHexString();
    const response = await request(app)
        .get(`/api/tickets/${id}`)
        .send()
        .expect(404);

    console.log(response.body);
});

it('returns the ticket if the ticket is found', async () => {
    const response = await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({
            title: 'concert',
            price: 20
        })
        .expect(201);

    const ticketResponse = await request(app)
        .get(`/api/tickets/${response.body.id}`)
        .send()
        .expect(200);

    expect(ticketResponse.body.title).toEqual('concert');
    expect(ticketResponse.body.price).toEqual(20);
});