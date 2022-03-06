import { useEffect, useState } from 'react';
import Router from 'next/router';
import StripeCheckout from 'react-stripe-checkout';
import buildClient from '../../api/build-client';
import useRequest from '../../hooks/use-request';

const orderShow = ({ data, currentUser }) => {
    console.log('orderId currentUser:', currentUser);
    const [timeLeft, setTimeLeft] = useState(0);
    const { doRequest, errors } = useRequest({
        url: '/api/payments',
        method: 'post',
        body: {
            orderId: data.id
        },
        onSucess: () => Router.push('/orders')  
    })

    useEffect(() => {
        const findTimeLeft = () => {
            const msLeft = new Date(data.expiresAt) - new Date();
            setTimeLeft(Math.round(msLeft / 1000));
        };

        // findTimeLeft을 바로 실행해주는 이유는 만약 즉시 실행해주지 않는다면 주문하고 난
        // 바로 직후에는 시간이 카운트 되지 않아서 setInterval로 다음 호출하기 전 까지의
        // 시간 공백(여기서는 1초)이 생긴다. 그래서 그것을 없애기 위해서 바로 호출해줘서 
        // 주문하자 마자 expire시간을 화면에 표시해준다.
        findTimeLeft();

        // 주의할 점은 findTimeLeft다음에 괄호()를 사용하면 함수를 호출하는 것이므로
        // findTimeLeft을 즉시 실행하고 그 결과값이 들어가게 되지만 괄호() 없이 함수를 넣으면
        // 그 함수 자체를 reference하게 되므로 setInterval함수가 실행될때 findTimeLeft
        // 가 실행되어 그 결과값이 setInterval함수가 실행되는 순간을 기준으로 결정된다.
        // 여기에서는 userEffect를 이용했기 때문에 주문하자마자 findTimeLeft를 호출해서 값이
        // 결정되면 setInterval로 다시 findTimeLeft를 실행해서 timeLeft의 값이 변하는 순간
        // re-rendering 된다.
        const timerId = setInterval(findTimeLeft, 1000);

        return () => clearInterval(timerId);
    }, [data]);

    if (timeLeft < 0) {
        return <div>Order is expired</div>
    };

    // stripeKey뒤에는 public key가 들어가야 하는데 이것을 환경변수화 시켜서 실행해야 안전하다.
    // 환경변수로 하기 위해서는 다른 곳에 파일을 변수 key value pair로 저장하고 key를 불러와야
    // 하는데 문제는 이 방식이 다른 모듈을 깔아야 하는 것 같이 보인다. 공식 문서에서는 설명이
    // 빈약해서 그냥 test project인 현 상황에서는 그냥 직접 값을 입력해서 작동하는 방식을 택하겠다.
    // 물론 실제로 배포할때 이 방식을 이용해서는 절대로 안된다.
    // 추가로, doRequest 함수 관련해서 안에 인자를 넣으면 그것이 default값으로 props = {} 로 되어
    // 있는데 그 인자가 props = { 인자 } 이런 형식으로 객체가 되었다가 그것이 body의 data와 병삽이
    // 되어서 함수가 작동한다. 그래서 여기서는 orderId, token 두가지가 body안에 담겨서 보내진다.
    // 한가지 더, StripeCheckout은 npm에 있는 stripe에서 제공하는 checkout 결제를 쉽게 사용할수 있게
    // 해주는 library로 [ticketId].js 파일에서 pay with card 버튼을 눌리면 창이 뜨면서 거기에 신용
    // 카드 정보를 넣으면 카드정보가 stripe서버에 먼저 날아가서 stripe에서 회신을 주고 거기에서 confirm이 
    // 되었다고 하고 그 confirm에 대한 회신으로 stripe에서 id가 날라오는데 이것이 일회용 token이다. 
    // 그리고 token항목에서 이것을 받아서 doRequest 함수를 이용하여 orderId와 token을 payments서버로 
    // 보내고 payments 서버에서 order 를 payments 서버내의 order database와 대조하여 맞는지 확인한
    // 다음 stripe 형식에 맞추어서 stripe 결제서버로 결제를 보낸다. 그리고 결제가 되었다고 stripe에서
    // 연락이 오면 payment서버에서 그 결과를 받아서 database에 저장하고 event publish한다.
    return (
        <div> 
            Time left to pay: {timeLeft}  seconds
            <StripeCheckout 
                token = {({ id }) => doRequest({ token: id})}
                stripeKey = "pk_test_51KX0ptDPEbw0CdXPyEW6GU8un0SZ4dAcJcR9eorsSttwq5oQl18BU30L93jG3GJJqbTQYt7xQIrAt7Mr1OlCxkGo00idlr1w5l"
                amount = {data.ticket.price}
                email = {currentUser.email}
            />
            {errors}
        </div>
    );
};

export async function getServerSideProps(context) {
    const { orderId } = context.query;
    const { data } = await buildClient(context)
                    .get(`/api/orders/${orderId}`)
                    .catch(err => { console.log('err:', err.message) });

    return {
        props: { data }, // will be passed to the page component as props
      }
  }

export default orderShow;