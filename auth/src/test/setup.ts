import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { ConnectOptions } from 'mongoose';
import request from 'supertest';
import { app } from '../app';

let mongo: any;
beforeAll(async () => {
    process.env.jwt = 'jwtKey';
    // 원래 실행시킬때는 index.ts 안에 start함수를 실행하는데 그 안에 
    // process.env.jwt가 있는지 검증하고 실행하고 그것은 secret pod
    // 안에 담겨 있어서 secret pod가 실행되어야 process.env.jwt가
    // 생성되는데 test에서는 그게 안되서 error 가 난다. 해결하기 위한
    // 여러가지 방법이 있지만 가장 직접적이고 확실한 방법은 process.env.jwt
    // 값을 수동으로 test 동안에만 적용가능하게 직접 입력해준다.

    mongo = await MongoMemoryServer.create();
    const mongoUri = await mongo.getUri();

    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    } as ConnectOptions)
});

beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
        await collection.deleteMany({});
    };
});

afterAll(async () => {
    await mongo.stop();
    await mongoose.connection.close();
});

// 아래 global.signin은 반드시 필요한 code는 아니고 global 변수에 함수를 추가해서
// 사용할 수 있다는 것을 coding 기법으로 보여주기 위해서 강의에서 추가로 시연하는
// 코드이다. 우선 declare로 type을 설정하고 global.signin에 함수를 추가한다.
// declare에서 signin함수가 return 값으로 promise를 반환하고 이 promise의 type은
// array of strings, 즉 배열안에 문자값이 순서대로 들어간다고 명시한다.
// 이렇게 하면 어떤 파일에서도 global.signin() 을 이용하면 해당 함수를 이용할 수
// 있다.
declare global {
    var signin: () => Promise<string[]>;
}

global.signin = async () => {
    const email = 'test@test.com';
    const password = 'password';

    const response = await (
        request(app)
            .post('/api/users/signup')
            .send({ email, password })
            .expect(201)
    );

    const cookie = response.get('Set-Cookie');

    return cookie
}

