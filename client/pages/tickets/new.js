import { useState } from 'react';
import Router from 'next/router';
import userRequest from '../../hooks/use-request';

const NewTicket = () => {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const { doRequest, errors } = userRequest({
        url: '/api/tickets',
        method: 'post',
        body: {
            title, price
        },
        onSucess: () => Router.push('/')
    });

    const onSubmit = (event) => {
        event.preventDefault();

        doRequest();
    }

    // blur는 자바스크립트 이펙트 함수중의 하나로 하나의 div안에 커서가 있다가
    // 커서를 div 밖으로 빼내서 클릭하면 이전 div안에서 작동하는 함수이다.
    // 현 페이지에서는 값 입력칸 안에 커서가 있다가 커서를 밖으로 빼서 커서를
    // 클릭하면 발생하게 된다.
    const onBlur = () => {
        const value = parseFloat(price);

        // isNaN은 자바스크립트 빌트인 함수로 숫자인지 아닌지 체크해주는 함수이다.
        if (isNaN(value)) {
            return;
        };

        setPrice(value.toFixed(2));
    };

    return (
        <div>
            <h1>Create Ticket</h1>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Title</label>
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="form-control" 
                    />
                </div>
                <div className="form-group">
                    <label>Price</label>
                    <input 
                        value={price}
                        onBlur = {onBlur} 
                        onChange={e => setPrice(e.target.value)}  
                        className="form-control" 
                    />
                </div>
                {errors}
                <button className="btn btn-primary">Submit</button>
            </form>
        </div>
    );
};

export default NewTicket;