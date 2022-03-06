import App from 'next/app'
import 'bootstrap/dist/css/bootstrap.css';
import buildClient from '../api/build-client';
import Header from '../components/header';
import Head from 'next/head';

// _app파일에서 bootstrap을 불러들이고 아래 Component, pageProps에서 pages
// 폴더에 있는 다른 page파일들이 argument로 들어가서 bootstrap이 적용되는
// 구조이다.
// 파일명은 반드시 _app이여야 하며 이것은 nextjs에서 지정해준 이름이다.
// ({ Component, pageProps }) => {....} 형식도 nextjs에서 지정되어서 반드시
// 이 형식만 가능하다.
// https://nextjs.org/docs/advanced-features/custom-app
const _app = ({ Component, pageProps, currentUser }) => {
    // _app 컴포넌트가 받는 Component props는 pages/index.jsx 이다.
    // 관련 상세 내용은 아래 링크 참조 요망.
    // https://velog.io/@carrot/Next.js-%EA%B3%B5%ED%86%B5-%ED%8E%98%EC%9D%B4%EC%A7%80-%EB%A7%8C%EB%93%A4%EA%B8%B0app
    console.log('_app pageProps:', Component)
    console.log('_app pageProps:', pageProps);
    console.log('_app currentUser:', currentUser);
    // 아래 <Head> 태그는 mixed-content-blocked error가 브라우저의 console에 계속 찍혀서 그거 해결하려고
    // stackoverflow에서 아래 meta tag안에 httpEquiv등을 넣으라고 해서 nextjs에서 metatag를 적용하려면
    // import Head from 'next/head'; 로 각 파일의 처음에 meta tag를 로드하도록 만들어준 것이다. meta
    // tag안의 내용은 모든 요청을 https로 하게 설정해주는 것이다. mixed-content-blocked error는 https
    // 를 사용해야 하는데 http를 사용해서 발생하는 문제이다. 상세 내용은 구글 검색 요망.
    return (
        <div>
            <Head>
                <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" /> 
            </Head>
            <Header currentUser={currentUser}/>
            <div className="container">
                <Component currentUser={currentUser} {...pageProps} />
            </div>
        </div>
    );
};

_app.getInitialProps = async (appContext) => {
    // nextjs는 처음 시작할때 App 클래스 컴포넌트 를 통해서 구동하는데 이 것을 커스텀할수 있도록
    // 만들어 놓았고 파일 이름은 무조건 _app이 되어야 한다. 방식은 App을 import 해서 내가 커스텀하는
    // 페이지의 getInitialProps 안에서 App.getInitialProps을 실행시켜서 그 return 값과 내가 커스텀
    // 하는 페이지의 return 값을 합친 다음 마지막에 export 하면 된다. 그러면 nextjs의 모든 파일에
    // 그 결과가 영향을 미친다. 참고로 파일 이름은 무조건 _app이 되어야 하지만 export하는 함수 이름은
    // 아무거나 해도 된다. 하지만 나는 통일성을 위해서 파일 이름과 같은 _app으로 정했다. 추가로 주의할
    // 점은 nextjs나 최신 기술이 도입된 라이브러리, 어플은 수시로 api가 변하기 때문에 옛날에 작성한
    // 코드가 먹히지 않는 경우가 많으니 stackoverflow를 볼때 주의해야 한다. 참고로 지금 App을 import
    // 한다는 것도 3년전 강사가 작성한 코드에서는 전혀 적용되지 않고 다른 코드로 커스텀 되어 있어서
    // 따로 공부한 다음 코드를 작성하는 것이다.
    const pageProps = await App.getInitialProps(appContext);

    // console.log(Object.keys(appContext)); // [ 'AppTree', 'Component', 'router', 'ctx' ]
    // appContext를 log찍어보면 나오는 object 중에서 ctx에 req 와 res가 들어있어서 그것을 뽑아내서
    // buildClient에 인자로 넘겨준다.
    const client = buildClient(appContext.ctx);
    const res = await client.get('/api/users/currentuser')
                            .catch(err => { console.log('err:', err.message) });

    // 바로 아래에 if(!res)문을 넣은 이유는 만약 사용자가 로그인을 하지 않고 처음들어온 상태이면 cookie
    // 가 없고 jwt도 없다. 그러므로 /api/users/currentuser 로 통신을 보내봤자 아무 대답이 없다.
    // 그러므로 res가 null이거나 undefined이기 때문에 이 경우는 따로 처리를 해줘서 _app에 인자로
    // 보낼 data 값을 빈객체로 넣어준다. 이렇게 하지 않으면 서버가 다운되는 심각한 에러가 발생한다.
    if (!res) {
        const res = {};
        return res;
    };

    const currentUser = res.data.currentUser;

    // // const pageProps = res.data;
    // let pageProps = {};
    // // 아래 appContext.ctx 을 pageProps에 할당하려고 하니 Circular structure 에러가 떠서 안된다.
    // // 추측하건데 객체 내부에서 객체를 참조하는 형식이거나 재귀 형식이라서 안된다고 본다.
    // // 아래와 같이 코드를 억지로 작성한 이유는 한단락 아래에 강사가 작성한 코드가 작동 안되서 억지로
    // // 수동으로 비슷한 형식을 만드려고 따라하는 것이다.
    // // pageProps.appCtx = appContext.ctx;
    // pageProps.client = client;
    // pageProps.currentUser = res.data.currentUser;
    // const currentUser = res.data.currentUser;

    // 아래 코드는 강사가 한 것인데 이게 2~3년 전의 nextjs코드라서 아래 코드가 적용이 안된다.
    // 그래서 일단 그런 코드가 있다는 것만 알고 내가 만든 코드로 적용하도록 한다.
    // let pageProps = {};
    // if (appContext.Component.getInitialProps) {
    //   pageProps = await appContext.Component.getInitialProps(
    //     appContext.ctx,
    //     client,
    //     data.currentUser
    //   );
    // }

    // 아래 return값은 위 _app함수의 두번째 인자인 pageProps로 들어가는데 여기서는 이름을
    // 똑같이 맞추지 않아도 두번째 인자로 들어가진다. console.log로 찍어보면 pageProps안에 객체가
    // 있고 이 객체의 key가 data, value가 currentUser고 currentUser안에 id, email 등이 들어가있다.
    // return 값에 두번째 currentUser를 넣으면 위 _app함수의 세번째 인자로 들어가진다.
    // 이번 프로젝트에서 원래 data만 _app 함수로 넘겨줘도 제대로 작동하지만 return 값을 한개 이상
    // 넘겨줘도 제대로 작동하는 예시를 위해서 일부러 return 값 두개를 _app의 인자로 넘겼다.
    return { pageProps, client, currentUser }
};

// nextjs에서 페이지 로딩할때 _app -> index 의 순으로 페이지를 로딩한다. 

export default _app;

// 2022년 1월 현재 _app파일에 rendering하기 위해서 getInitialprops을 써야한다.
// 다른 page에서는 getServerSideProps 메소드가 지원되지만 _app 에서는 지원되지
// 않아서 부득이 하게 여기서는 getInitialprops을 이용해서 모든 페이지에 적용되는
// header를 만들었다. 추후 nextjs 버전이 높아지면 _app에서도 getServerSideProps이
// 사용가능할 수도 있는데 그러면 그때 getServerSideProps을 적용하는 것으로 하자.

// 위의 ({ Component, pageProps }) => {....} 함수는 nextjs에서 bootstrap을
// 사용하기 위한 두가지 방법중의 하나이다. 나머지 하나는 html에 파일에서 link
// tag에 href="httls://~~~" 하는 식으로 cdn의 link를 걸어주는 방법이고 이것도
// Component, pageProps 방식과 마찬가지로 정확하게 정해진 방식이 있어서 그것을
// 따라야 nextjs에서 사용 가능하다.