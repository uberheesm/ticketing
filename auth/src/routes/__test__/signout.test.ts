import request from 'supertest';
import { app } from '../../app';

it('crears the cookie after signing out', async () => {
    await (
        request(app)
            .post('/api/users/signup')
            .send({ 
                email: 'test@test.com',
                password: 'password'
            })
            .expect(201)
    );

    const response = await (
        request(app)
            .post('/api/users/signout')
            .send({})
            .expect(200)
    );

    // console.log(response.get('Set-Cookie'));
    // 'Set-Cookie'의 로그를 찍어보면 배열 안에 toEqual함수안의 'session...'이 나온다.
    // 그것은 logout할때마다 항상 같은 값이 나오므로 response에 그 값이 나오는지 검증하면 된다.
    expect(response.get('Set-Cookie')[0]).toEqual('session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly');
});