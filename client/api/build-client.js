import axios from 'axios';

export default ({ req }) => {
    return axios.create({
        baseURL: 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local',
        // req는 http request시 전달되는 정보 전부다이며 이것이 getServerSideProps로 들어오는데
        // 이 중에서 headers의 정보가 중요하다. 왜냐하면 headers내에 Host가 ticketing.dev라고
        // 적혀 있는데 ingress-nginx가 이것을 읽고 dns를 ticketing.dev/api/users/currentuser로
        // routing 하기 때문이다. 그렇지 않으면 ingress-nginx-controller.ingress-nginx....로
        // 진행되는 정보를 ingress-nginx가 어디로 연결해야 될지 몰라서 진행이 되지 않고 error가
        // 발생하게 된다. 정확하게는 ingress-srv.yaml 파일안에 ticketing.dev가 host명으로 등록
        // 되어 있어서 header내의 Host이름이 ticketing.dev로 일치하기 때문에 ingress-nginx가
        // header내의 Host를 인식하고 연결하는 것이다. 아니면 직접 string으로 'ticketing.dev'
        // 를 입력해줘도 되는데 이것은 request header 방식보다 덜 유연하고 덜 일반적인 단점이 있다.
        // https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering
        // 위 링크를 참조하면 원래 argument로 context가 들어오게 되어 있고 여기에서 params, req, 
        // res, query등 여러가지 정보가 nested object 형태로 들어온다. 여기서 Host정보가 필요하므로 
        // 그것이 있는 req안의 headers가 있어야 하므로 destructuring으로 req만 가져온 것이다. 
        // 참고로 req는 The HTTP IncomingMessage object이고 res는 The HTTP response object이다. 
        // 상세 정보는 위 링크 클릭해서 참조 요망.
        // 또한 req.headers안에는 cookie가 있는데 이것 또한 ingress를 통해서 서버로 해당 정보를
        // 전달해야 하기 때문에 req.headers를 headers에 배당하는 것은 중요하다.
        headers: req?.headers,
        // req뒤에 ?를 붙인 이유는 signup이나 signin 하지 않고 ticketing.dev로 바로간 다음 
        // ticketing.dev/auth/signup 페이지로 가면 header가 undefined되었다고 나온다.
        // 이것은 왜냐하면 _app -> index를 거치면서 페이지를 로딩하기 위해서 인자를 넘겨주는데
        // 처음에 ticketing.dev로 가고 바로 signup페이지로 가면 빈객체가 인자로 가게 된다.
        // 아마 그것 때문에 req.header에 문제가 있는 것으로 추측된다. (확실하지 않은데 지금 현재
        // 확인할 방법이 없어서 나름대로의 분석을 기록으로만 남겨 놓는다)
        // 그래서 ?를 붙여서 req가 없을 경우 null 값으로 만들어서 headers 옵션을 꺼버린다.
        withCredentials: true
        // 바로 위 withCredentials는 cross domain 문제가 발생하거나 CORS 문제가 발생할 때 해결하기
        // 위하여 true로 설정하는 것이다.
    })
};

// 위 axios를 이용해서 auth내의 currentUser에 접근하려면 두가지 방법이 있다. 1)서비스내의 이름을
// 이용해서 접근하는 방법이 있고 2) kunernetes의 DNS를 통해서 service와 pod에 접근하는 것으로 
// ingress의 DNS에 접근한 다음 ingress의 rotuer를 따라 auth container에 접근하는 방식이 있다.
// 첫번째 방식인 서비스 이름을 이용하는 방법도 한 방법이지만 여기서는 두번째 방식을 사용하도록 하겠다.
// 왜냐하면 서비스 이름으로 접근하려면 반드시 같은 namespace 안에 속한 service에서만 service 끼리 
// 접속하는 것이 가능하기 때문이다. 그래서 한정된 조건에서만 사용가능한 방식이고 여기서는 사용이 불가능
// 한데 왜냐하면 ingress는 ingress-nginx namespace에 속해 있고 auth-srv는 dafault namespace에 속해
// 있기 때문이다.
// 두번째 방식을 통해서 쿠버네티스에서 다른 namespace에 속한 service에 접근하려면 다음과 같은 dns 
// 이름을 따른다. http://NAMEOFSERVICE.NAMESPACE.svc.cluster.local
// 먼저 kubectl get namespace를 해서 해당 namespace의 이름을 확인한다. 이 케이스에서는 ingress-nginx
// 이다. 그리고 kubectl get service -n ingress-nginx 명령어로 해당 namespace의 서비스 이름을 확인한
// 다. 여기서는 ingress-nginx-controller 이다. 그렇게 되면 내부에서 ingress-nginx에 접근하기 위해서
// 최종적으로 다음의 dns 주소로 접속한다. 
// http://ingress-nginx-controller.ingress-nginx.svc.cluster.local
// 만약 같은 namespace에 속해있다고 가정하고 첫번째 방식인 서비스 이름으로 접속하려면 다음의 dns로 
// 접속하면 된다. http://auth-srv 아니면 external name service라는 service를 만들고 여기서 외부의
// namespace상 service의 dns를 등록시키고 이  external name service에 접속해서 외부로 접속하는'
// 방법도 있지만 서비스를 하나 추가하는 거라서 구조가 더 복잡해지므로 그냥 kunernetes DNS로 직접 
// 접속하는 것이 속편하다.
// 참고로 현재 프로젝트같이 namespace를 지정하지 않고 pod, deployment, service를 만들면 자동으로
// default namespace안에 생성되어 존재한다.