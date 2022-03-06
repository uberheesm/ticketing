import Queue from 'bull';
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import { natsWrapper } from '../nats-wrapper';

interface Payload {
    orderId: string;
}

const expirationQueue = new Queue<Payload>('order:expiration', {
    redis: {
        // infra의 k8s 폴더에 expiration-depl.yaml에서 REDIS_HOST에 host service가
        // 정의되어 있다. 그리고 그 정의된 것을 환경변수로 불러낼수 있다.
        host: process.env.REDIS_HOST
    }
});

expirationQueue.process(async (job) => {
    new ExpirationCompletePublisher(natsWrapper.client).publish({
        orderId: job.data.orderId
    })
});

export { expirationQueue };