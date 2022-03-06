import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser } from '@lsmticket/common';
import { indexOrderRouter } from './routes/index';
import { newOrderRouter } from './routes/new';
import { showOrderRouter } from './routes/show';
import { deleteOrderRouter } from './routes/delete';

const app = express();
// 아래 'trust proxy'는 reverse proxy를 말하는 것으로 ingress nginx를 사용하기
// 때문에 아래 세팅에 true로 설정하였다. 기본값은 false이다.
app.set('trust proxy', true);
app.use(json());
app.use(cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test'
}));
// jest할때 supertest모듈을 사용하고 이 모듈은 https가 아닌 http로 통신한다. 그리고
// secure값을 true로 하면 https 통신에만 cookie를 전송하도록 cookie-session 모듈은
// 설정가능하다. nodejs의 환경변수는 process.env.NODE_ENV에 있는데 이것은 jest 
// 실행중에는 값이 test로 세팅된다. 그래서 jest 실행시에는 secure값이 false가 되도록 
// 구문을 작성하였다. (https://jestjs.io/docs/environment-variables)

app.use(currentUser);
app.use(indexOrderRouter);
app.use(newOrderRouter);
app.use(showOrderRouter);
app.use(deleteOrderRouter);
app.use(errorHandler);

app.all('*', async (req, res, next) => {
    // express가 router상에서 error처리할때 async를 지원하지 않는다. 그래서 바로 
    // 아래처럼 next를 사용해서 error를 처리할 수 있지만 throw를 사용하지 않아서 
    // 가독성이 많이 떨어진다. 그래서 대부분 사용하지 않고 비동기 함수를 바깥에 
    // 감싸준 다음 그 안에서 async를 실행하거나 아니면 express-async-errors 같이 
    // async를 지원하는 모듈을 사용한다. 함수를 바깥에 감싸주는 것에 대해서는 양이 
    // 많아서 여기에 다 적기 힘든 관계로 express error async로 구글 검색해서 따로 
    // 예시 코드를 읽어보도록 한다. 

    // next(new NotFoundError());
    throw new NotFoundError();
});


export { app };