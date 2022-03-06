import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { ConnectOptions } from 'mongoose';
import jwt from 'jsonwebtoken';

jest.mock('../nats-wrapper');
// jest.mock('../stripe');

// 아래 process.env.STRIPE_KEY는 jest에서 mock을 쓰지 않고 직접 test 하기 위해서
// 환경변수를 직접 부르고 key value도 hard coding해서 입력하는 것이다. beforeAll
// 밖으로 빼준 이유는 stripe를 불러서 이용하는 부분이 프로그램 실행하자 마자 가장
// 먼저 진행되기 때문에 최우선 적으로 실행위해서이다.
process.env.STRIPE_KEY = 'sk_test_51KX0ptDPEbw0CdXPE6ATSbtW71woIUNGeXBOok13UySVU8L5XeajdVUGFgucX8CqTN2ERMUOXEvWTcNj5s5mlMwT00YkPo23f5';

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
    jest.clearAllMocks();
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
        await collection.deleteMany({});
    };
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

// 아래 global.signin은 반드시 필요한 code는 아니고 global 변수에 함수를 추가해서
// 사용할 수 있다는 것을 coding 기법으로 보여주기 위해서 강의에서 추가로 시연하는
// 코드이다. 우선 declare로 type을 설정하고 global.signin에 함수를 추가한다.
// declare에서 signin함수가 return 값으로 promise를 반환하고 이 promise의 type은
// array of strings, 즉 배열안에 문자값이 순서대로 들어간다고 명시한다.
// 이렇게 하면 어떤 파일에서도 global.signin() 을 이용하면 해당 함수를 이용할 수
// 있다.
declare global {
    var signin: (id?: string) => string[];
}

global.signin = (id?: string) => {
    // Build a JWT payload. { id, email }
    const payload = {
        id: id || new mongoose.Types.ObjectId().toHexString(),
        email: 'test@test.com'
    };

    // Create the JWTid
    const token = jwt.sign(payload, process.env.jwt!);

    // Build session object { jwt: MY_JWT }
    const session = { jwt: token };

    // Turn that session into JSON
    const sessionJSON = JSON.stringify(session);

    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString('base64')

    // return a string thats the cookie with the encoded data
    return [`session=${base64}`];
    // 바로위에 강사는 express:sess=${base64} 로 했다. 왜냐하면 cookie-session의 형태가 그러하기
    // 때문인데 이상하게 그렇게 하면 계속 에러가 나고 session=${base64} 방식으로 해야 제대로 실행이
    // 된다. 이유가 명확하지 않지만 추측하자면 cookie-session library의 공식문서를 보면 cookie의
    // 이름은 따로 설정하지 않으면 default로 session으로 지정된다고 하는데 아마 default 이름으로 
    // 지정해야 제대로 작동되지 않나 싶다.
}

