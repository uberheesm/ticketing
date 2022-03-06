import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_KEY!, {
    apiVersion: '2020-08-27'
});
// apiVersion은 api가 만들어진 날짜를 stripe에서 정해준 것으로 반드시 정해진 날짜를 적어야하는데
// 그래야 apiVersion이 맞아떨어져서 사용 가능하기 때문이다.