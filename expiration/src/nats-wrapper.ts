import nats, { Stan } from 'node-nats-streaming';

// 아래 _client 의 물음표는 지금은 initialize하지 않지만 나중에 initianlize 하겠다는
// 신호를 typescript에게 준 것으로 이것을 사용하지 않으면 에러가 발생한다.
// optional chaining이라고 하는 기법이다
class NatsWrapper {
    private _client?: Stan;

    // getter와 setter는 typescript와 javascript의 사용법이 동일하며 아래에서는 private 
    // 값에 접근하기 위해서 getter를 사용하였다. 얼핏 보기에는 함수 같아 보이지만 getter로  
    // 접근한 것은 함수가 아니라 프로퍼티 이므로 NatsWrapper.client: nats.Stan 이다.
    // 이것을 사용한 것이 ticket-created-publisher 파일에서 new TicketCreatedPublisher
    // 인데 여기서 인자를 보면 natsWrapper.client() 가 아닌 natsWrapper.client를 사용
    // 하였다. 
    // 참조) https://yamoo9.gitbook.io/typescript/classes/getter-setter
    get client() {
        if (!this._client) {
            throw new Error('Cannot access NATS client before connecting')
        };
        
        return this._client;
    }

    connect(clusterId: string, clientId: string, url: string) {
        this._client = nats.connect(clusterId, clientId, { url });

        return new Promise<void>((resolve, reject) => {
            this.client.on('connect', () => {
                console.log('Connected to NATS');
                resolve();
            });
            this.client.on('error', (err) => {
                reject(err);
            });
        });

    }
}

export const natsWrapper = new NatsWrapper();

// 위와 같은 방식을 싱글톤 패턴이라고 한다. instance를 하나만 만들어서 전 서버에서 모두
// 공유하는 것. 이런 방식은 mongoose에서도 사용하는 방식으로 동일한 instance를 이용해서
// 어떤 데이터와 스키마 등을 공유해야 할 때 사용된다.
// 여기에서는 index.ts와 TicketCreated Route Handler에서 instance를 공유한다. 그러므로 
// 가장 주의해서 봐야 할 것은 마지막에 instance를 export하지 class를 export 하지 않는다는 
// 점이다.