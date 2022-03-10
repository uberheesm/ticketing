// // currentUser를 여기서도 호출하고 _app에서도 호출해서 중복호출하는 문제가 있어서
// // 이를 고치기 위해 buildClient를 주석처리 하였다. 원래 잘 작동하는 코드인데 강사가 실수로
// // 두번 코드 작성하였다. (취소함)
// // 원래는 바로 위 내용처럼 주석처리 하였으나 취소하였다. 왜냐하면 강사는 getInitialProps
// // 함수로 페이지를 작성하였으나 nextjs 버전업되면서 그 함수는 폐지되고 getServerSideProps
// // 로 대체되어서 이거 쓰는 바람에 코드가 꼬여버렸다. 그래서 주석처리 했다가 삽질하고 다시
// // 원래 내가 작성했던 코드로 돌아간다.
import Link from 'next/link';
import buildClient from '../api/build-client';
// // 원래 export default IndexPage; 구문 아래에 import axios...로 시작하는 구문으로
// // index페이지를 다 만들었었는데 코드의 재사용성을 높이기 위해서 axios를 통하여 통신하는
// // 부분을 쪼개서 모듈로 따로 만들어서 api폴더에 build-client로 분리시키고 index에서는 
// // index에서만 구현되는 상세정보만 이용하여 코드를 작성하였다. 이렇게 하면 다른 페이지를
// // 만들때 axios 부분은 언제든지 build-client만 불러오면 사용 가능하다.

const IndexPage = ({ data }) => {
    // console.log('IndexPage data:', data);
    // return data.currentUser ? (<h1>Hello, { `${data?.currentUser?.email} is signed in`}</h1>) : (<h1>You are NOT signed in</h1>)

    let ticketList;

    // 아래 Link 태그에서 href는 page상의 파일이름, 즉 nextjs가 인지할 수 있도록 하는 이름을
    // 넣어주고 실제로 이동하는 것은 as 뒤의 경로로 이동하게 된다
    if (data.tickets) {
        ticketList = data.tickets.map((ticket) => {
            return (
                <tr key={ticket.id}>
                    <td>{ticket.title}</td>
                    <td>{ticket.price}</td>
                    <td>
                        <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
                            <a>View</a>
                        </Link>
                    </td>
                </tr>
            );
        })
    
    };

    return (
        <div>
            <h1>Tickets</h1>
            <table className='table'>
                <thread>
                    <tr>
                        <th>Title</th>
                        <th>Price</th>
                        <th>Link</th>
                    </tr>
                </thread>
                <tbody>
                    {ticketList}
                </tbody>
            </table>
        </div>
    );
};

export const getServerSideProps = async (context) => {
    let data = {};
    // console.log('IndexPage context:', context);
    // console.log('IndexPage client:', context.req.client);
    const responseCurrentUser = await buildClient(context)
                            .get('/api/users/currentuser')
                            .catch(err => { console.log('err:', err.message) });
                            // try catch 문은 모든 상황에 다 적용되고 .catch로 chaining
                            // 방식 error구문은 앞의 구문이 Promise를 return할때 가능하다.

    // 바로 아래에 if(!res)문을 넣은 이유는 만약 사용자가 로그인을 하지 않고 처음들어온 상태이면 cookie
    // 가 없고 jwt도 없다. 그러므로 /api/users/currentuser 로 통신을 보내봤자 아무 대답이 없다.
    // 그러므로 res가 null이거나 undefined이기 때문에 이 경우는 따로 처리를 해줘서 IndexPage에 인자로
    // 보낼 data 값을 빈객체로 넣어준다. 이렇게 하지 않으면 서버가 다운되는 심각한 에러가 발생한다.
    if (!responseCurrentUser) {
        return { props: { data } };
    };

    data.currentUser = responseCurrentUser.data.currentUser;

    // responseCurrentUser는 사용자가 로그인 했는지 확인하기 위한 것이고 responseTicket은 사용자가
    // 구매한 티켓을 보여주기 위한 것이다. 원래는 responseCurrentUser를 하지 않고 _app에서 index로
    // 데이터가 내려와야 하는데 강사가 제공한 코드는 3년전 버전이라서 강사는 잘 되는데 나는 데이터가
    // index로 내려오지 않아서 responseCurrentUser에서 한번 더 통신해서 현재 사용자 정보 받아왔다.
    const responseTicket = await buildClient(context)
                        .get('/api/tickets')
                        .catch(err => { console.log('err:', err.message) });

    if (!responseTicket) {
        return { props: { data } };
    };    

    data.tickets = responseTicket.data;
    // console.log('res data:', res)
    // console.log('index data:', data);

    // 아래 { props: { data } } 안의 data와 위 IndexPage의 argument인 { data }는
    // 이름이 반드시 일치해야 한다. 일치하지 않으면 object를 argument로 아예 받아오지
    // 못하기 때문에 확인해보면 console.log에 undefined 되었다고 뜬다. 
    return { props: { data } }; 
};

export default IndexPage;

// // 여기서 부터 원래 index파일의 코드부분이다.
// import axios from "axios";

// const IndexPage = ({ data }) => {
//     console.log(data)
//     return <h1>Hello, {data?.currentUser.email ?? 'user'}</h1>
// };

// // 아래 axios를 이용해서 auth내의 currentUser에 접근하려면 두가지 방법이 있다. 1)서비스내의 이름을
// // 이용해서 접근하는 방법이 있고 2) kunernetes의 DNS를 통해서 service와 pod에 접근하는 것으로 
// // ingress의 DNS에 접근한 다음 ingress의 rotuer를 따라 auth container에 접근하는 방식이 있다.
// // 첫번째 방식인 서비스 이름을 이용하는 방법도 한 방법이지만 여기서는 두번째 방식을 사용하도록 하겠다.
// // 왜냐하면 서비스 이름으로 접근하려면 반드시 같은 namespace 안에 속한 service에서만 service 끼리 
// // 접속하는 것이 가능하기 때문이다. 그래서 한정된 조건에서만 사용가능한 방식이고 여기서는 사용이 불가능
// // 한데 왜냐하면 ingress는 ingress-nginx namespace에 속해 있고 auth-srv는 dafault namespace에 속해
// // 있기 때문이다.
// // 두번째 방식을 통해서 쿠버네티스에서 다른 namespace에 속한 service에 접근하려면 다음과 같은 dns 
// // 이름을 따른다. http://NAMEOFSERVICE.NAMESPACE.svc.cluster.local
// // 먼저 kubectl get namespace를 해서 해당 namespace의 이름을 확인한다. 이 케이스에서는 ingress-nginx
// // 이다. 그리고 kubectl get service -n ingress-nginx 명령어로 해당 namespace의 서비스 이름을 확인한
// // 다. 여기서는 ingress-nginx-controller 이다. 그렇게 되면 내부에서 ingress-nginx에 접근하기 위해서
// // 최종적으로 다음의 dns 주소로 접속한다. 
// // http://ingress-nginx-controller.ingress-nginx.svc.cluster.local
// // 만약 같은 namespace에 속해있다고 가정하고 첫번째 방식인 서비스 이름으로 접속하려면 다음의 dns로 
// // 접속하면 된다. http://auth-srv 아니면 external name service라는 service를 만들고 여기서 외부의
// // namespace상 service의 dns를 등록시키고 이  external name service에 접속해서 외부로 접속하는'
// // 방법도 있지만 서비스를 하나 추가하는 거라서 구조가 더 복잡해지므로 그냥 kunernetes DNS로 직접 
// // 접속하는 것이 속편하다.
// // 참고로 현재 프로젝트같이 namespace를 지정하지 않고 pod, deployment, service를 만들면 자동으로
// // default namespace안에 생성되어 존재한다.

// export const getServerSideProps = async ({ req }) => {
//     const { data } = await axios.get(
//         'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser',
//         {
//             // 바로 아래 withCredentials는 cross domain 문제가 발생하거나 CORS 문제가 발생할 때 해결하기
//             // 위하여 true로 설정하는 것이다.
//             withCredentials: true,
//             headers: req.headers
//             // req는 http request시 전달되는 정보 전부다이며 이것이 getServerSideProps로 들어오는데
//             // 이 중에서 headers의 정보가 중요하다. 왜냐하면 headers내에 Host가 ticketing.dev라고
//             // 적혀 있는데 ingress-nginx가 이것을 읽고 dns를 ticketing.dev/api/users/currentuser로
//             // routing 하기 때문이다. 그렇지 않으면 ingress-nginx-controller.ingress-nginx....로
//             // 진행되는 정보를 ingress-nginx가 어디로 연결해야 될지 몰라서 진행이 되지 않고 error가
//             // 발생하게 된다. 정확하게는 ingress-srv.yaml 파일안에 ticketing.dev가 host명으로 등록
//             // 되어 있어서 header내의 Host이름이 ticketing.dev로 일치하기 때문에 ingress-nginx가
//             // header내의 Host를 인식하고 연결하는 것이다. 아니면 직접 string으로 'ticketing.dev'
//             // 를 입력해줘도 되는데 이것은 request header 방식보다 덜 유연하고 덜 일반적인 단점이 있다.
//             // https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering
//             // 위 링크를 참조하면 원래 argument로 context가 들어오게 되어 있고 여기에서 params, req, 
//             // res, query등 여러가지 정보가 nested object 형태로 들어온다. 여기서 Host정보가 필요하므로 
//             // 그것이 있는 req안의 headers가 있어야 하므로 destructuring으로 req만 가져온 것이다. 
//             // 참고로 req는 The HTTP IncomingMessage object이고 res는 The HTTP response object이다. 
//             // 상세 정보는 위 링크 클릭해서 참조 요망.
//             // 또한 req.headers안에는 cookie가 있는데 이것 또한 ingress를 통해서 서버로 해당 정보를
//             // 전달해야 하기 때문에 req.headers를 headers에 배당하는 것은 중요하다.
//         }
//     ).catch(err => { console.log('err:', err) });

//     console.log('data:', data);
 
//     // 아래 { props: { data } } 안의 data와 위 IndexPage의 argument인 { data }는 이름이 반드시 일치해야
//     // 한다. 일치하지 않으면 object를 argument로 아예 받아오지 못하기 때문에 확인해보면 console.log에 
//     // undefined 되었다고 뜬다. 그리고 아래 return 값이 반드시 { props: [object] } 형식으로 되어야 하기 
//     // 때문에 {} 로 값의 바깥을 반드시 감싸줘야 한다.
//     // data문에서 받은 정보는 auth폴더내 routes 폴더의 current-user.ts에서 /api/users/currentUser에서
//     // res.send문 안에 송신한 정보가 들어온다.

//     return { props: { data } };
// };

// export default IndexPage;

// nextjs의 경우 아직 typescript가 제대로 지원되지 않는 부분이 있어서 수동으로
// 코드에 annotation을 달아야 하는데 관련 정보 찾고 없으면 질문해서 답변 받고 
// 하는 형식으로 진행해야 하는데 그러면 시간이 너무 많이 걸린다. 그래서 nextjs는
// javascript로 코딩하고 나머지 backend 부분은 typescript로 만든다고 한다.