import buildClient from '../../api/build-client';

const OrderIndex = ({ data, currentUser }) => {
  return (
    <ul>
      {data.map(order => {
        return (
          <li key={order.id}>
            {order.ticket.title} - {order.status}
          </li>
        );
      })}
    </ul>
  );
};

export async function getServerSideProps(context) {
    const { data } = await buildClient(context)
                    .get('/api/orders')
                    .catch(err => { console.log('err:', err.message) });

    return {
        props: { data }, // will be passed to the page component as props
      }
  }

export default OrderIndex;