import Router from 'next/router';
import buildClient from '../../api/build-client';
import useRequest from '../../hooks/use-request';

const TicketShow = ({ data }) => {
    console.log(data);
    const { doRequest, errors } = useRequest({
        url: '/api/orders',
        method: 'post',
        body: {
            ticketId: data.id
        },
        onSucess: (order) => Router.push('/orders/[orderId]', `/orders/${order.id}`)
    });


    // 아래 onClick={() => doRequest()} 을 하는 이유는 만약 onClick={doRequest}를 할 경우에
    // 클릭을 하면서 함수가 실행되고 그와 동시에 이벤트 인자가 doReuqest(event) 이런 식으로 들어가서
    // doReuqest함수에 작동한다. use-request.js파일을 보면 doRequest(props={})로 props인자가 
    // default값은 빈객체이지만 뭔가가 들어가면 그것이 객체 형태로 인자가 되어 아래 body와 합쳐진다.
    // 그래서 body에 클릭 event 데이터가 들어가면 당연히 error이 발생하게 된다. 그래서 클릭을 하면
    // return 값으로 함수가 실행되도록 한 것이고, 인자를 아무것도 넣지 않은 것도 event인자가 들어가면
    // error가 발생하기 때문이다.
    return (
        <div>
            <h1>Title: {data.title}</h1>
            <h4>Price: {data.price}</h4>
            {errors}
            <button onClick={() => doRequest()} className="btn btn-primary">Purchase</button>
        </div>
    )
};

export async function getServerSideProps(context) {
    // console.log('ticketId in ticketId page:', context.query);
    // [client] ticketId in ticketId page: { ticketId: '622213f2dc3ea9704e162cb8' }

    const { ticketId } = context.query;
    const { data } = await buildClient(context)
                    .get(`/api/tickets/${ticketId}`)
                    .catch(err => { console.log('err:', err.message) });

    // console.log('data in ticketId page:', data);
    // [client] data in ticketId page: {
    // [client]   title: 'zz',
    // [client]   price: 123,
    // [client]   userId: '622213b72a52c0aec61374d9',
    // [client]   version: 0,
    // [client]   id: '622213cfdc3ea9704e162cb2'
    // [client] }              


    return {
      props: { data }, // will be passed to the page component as props
    }
  }

export default TicketShow;