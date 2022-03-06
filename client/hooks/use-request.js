import axios from "axios";
import { useState } from 'react';

const useRequest = ({ url, method, body, onSucess }) => {
    // method는 axios의 restful api이므로 get, post, patch 등이 해당된다.
    const [errors, setErrors] = useState(null);

    const doRequest = async (props = {}) => {
        try {
            // 바로 아래 setErrors(null) 을 하는 이유는 새로운 데이터를 입력하기
            // 전에 error 창이 사라지게 만들어서 다음 데이터에 대한 값이 성공일때
            // error 메세지가 보이지 않게 하려고 함이다. 만약 이게 없으면 먼저
            // 입력한 값이 error로 메세지가 뜨고 그 다음에 다른 데이터를 입력하여
            // 성공해도 error 메세지 창이 없어지지 않는다.
            setErrors(null);
            const response = await axios[method](url, { ...body, ...props });

            if (onSucess) {
                onSucess(response.data)
            };

            return response.data;
        } catch (err) {
            setErrors(
                <div className="alert alert-danger">
                <h4>Error</h4>
                <ul className="my-0">
                    {err.response.data.errors.map(err => 
                        <li key={err.message}>{err.message}</li>)
                    }
                </ul>
                </div>
            );
        };
    };

    return { doRequest, errors };
};

export default useRequest;