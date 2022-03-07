import mongoose from 'mongoose';

import { app } from './app';


const start = async () => {
    console.log('Startup auth server!!!');

    if (!process.env.jwt) {
        throw new Error('jwt must be defined')
    };
    // jwt는 kubernetes의 secret라는 특수 pods에 들어있고 command line으로 입력하거나
    // yaml파일로 secret pod를 configure할 수 있고 이 것을 auth-depl.yaml파일에서
    // 지정해서 enviromental variable로 지정가능하다. 여기서 jwt가 없을 경우 사용자의
    // json web token을 검증하는 key가 없어서 server의 진행이 불가능하기 때문에 처음
    // 구동시 check해서 아예 server 시작을 못하도록 막아버리는 것이다.

    try {
        await mongoose.connect('mongodb://auth-mongo-srv:27017/auth');
        console.log('connected to mongodb');
    } catch (err) {
        console.error(err);
    };
    
    app.listen(3000, () => {
        console.log('listening on port 3000');
    });
};

start();


// npm install --save-dev @types/jest @types/supertest jest ts-jest supertest mongodb-memory-server
// test를 위해서 install한 명령어. --save-dev은 실제 production에서는 사용되지 않고 개발 단계에서만 사용하기
// 위하여 쓰인 명령어. 