import { useState } from "react";
import { useRouter } from 'next/router';
import useRequest from '../../hooks/use-request';

const signin = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { doRequest, errors } = useRequest({
        url: '/api/users/signin',
        method: 'post',
        body: { email, password },
        onSucess: () => router.push('/')
    });


    const onSubmit = async (event) => {
        event.preventDefault();
        doRequest();
    };

    return (
        <form onSubmit={onSubmit}>
            <h1>Signin</h1>
            <div className="form-group">
                <label>Email Address</label>
                <input 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="form-control" 
                    // type="email" 
                />
            </div>
            <div className="form-group">
                <label>password</label>
                <input
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="form-control" 
                    type="password" 
                />
            </div>
            {errors}
            <button className="btn btn-primary">Signin</button>
        </form>
    );
};

export default signin;

// 위에서 signup button 바로 위 {errors} 변수가 들어가는 곳에 원래 있던 코드이다.
// 이렇게 하면 재사용이 어려워서 doRequest라는 custom hook을 만들어서 기존 코드를
// 대체했다. 아래 코드에서 눈여겨볼점은 {}가 중첩되어 변수가 설정이 된다는 점이다.
// 자세히 보면 {} 가 3중으로 중첩되어 있는데 이런 코딩 패턴을 처음 봐서 참조용으로
// 보관해 놓는다.
// {errors.length > 0 && (<div className="alert alert-danger">
// <h4>Error</h4>
// <ul className="my-0">
//     {errors.map(err => <li key={err.message}>{err.message}</li>)}
// </ul>
// </div>)}

