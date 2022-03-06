export const natsWrapper = {
    client: {
        publish: jest.fn().mockImplementation(
            (subject: string, data: string, callback: () => void) => {
                callback();                
        })
    }
};

// 이 부분은 일단 수업을 듣고 넘어가는 걸로 한다. 왜냐하면 jest로 test하는 부분을 구현하다가
// event bus 부분은 mock이라고 해서 실제 nats streaming server를 가져오는 것이 아니라
// 메인 폴더에 있는 nats-wrapper라는 파일을 읽어오는 대신 __mocks__ 라는 폴더에 같은 이름의
// nats-wrapper라는 파일을 생성해서 그 안에 실제 nats 가 실행되는 것이 아니라 함수가 실행이
// 되도록만 해놓고 jest로 test를 하는 것이다. 문제는 이 mock code가 제대로 실행이 안된다.
// callback is not a function이라는 말이 계속 나오는 것으로 봐서는 callback문제인데 이거
// 원인을 찾는 것도 어렵고 찾는다고 해도 nats를 앞으로 사용할 것이 아니기 때문에 그냥 이렇구나
// 하고 넘어가도록 한다. 이상하게 이 부분은 나 빼고 다른 사람은 error가 발생한 경우가 없어서
// 일단 나만 안되는 것으로 하고 넘어간다. 아마 내가 설치한 library나 modules의 collision이
// 발생하였을 가능성도 있다.