import { natsWrapper } from './nats-wrapper';
import { OrderCreatedListener } from './events/listeners/order-created-listener';

const start = async () => {
    if (!process.env.NATS_CLIENT_ID) {
        throw new Error('NATS_CLIENT_ID must be defined')
    };

    if (!process.env.NATS_URL) {
        throw new Error('NATS_URL must be defined')
    };

    if (!process.env.NATS_CLUSTER_ID) {
        throw new Error('NATS_CLUSTER_ID must be defined')
    };

    try {
        // infra/k8s 폴더의 nats-depl 파일의 arg항목에서 cid가 ticketing으로 설정되어 있고
        // 이것이 cluster id 이다
        await natsWrapper.connect(
                process.env.NATS_CLUSTER_ID, process.env.NATS_CLIENT_ID, process.env.NATS_URL
            );
        natsWrapper.client.on('close', () => {
            console.log('NATS connection closed');
            process.exit();
        });

        process.on('SIGINT', () => natsWrapper.client.close());
        process.on('SIGTERM', () => natsWrapper.client.close());

        process.on('uncaughtException', function (err) {
            console.log(err);
        }); 

        new OrderCreatedListener(natsWrapper.client).listen();
    } catch (err) {
        console.error(err);
    };    
};

start();


// npm install --save-dev @types/jest @types/supertest jest ts-jest supertest mongodb-memory-server
// test를 위해서 install한 명령어. --save-dev은 실제 production에서는 사용되지 않고 개발 단계에서만 사용하기
// 위하여 쓰인 명령어. 