import { useRouter } from 'next/router';
import { useEffect } from "react";
import useRequest from "../../hooks/use-request";

const signout = () => {
    const router = useRouter();
    const { doRequest } = useRequest({
        url: '/api/users/signout',
        method: 'post',
        body: {},
        onSucess: () => router.push('/')
    });

    useEffect(() => {
        doRequest();
    }, [])

    return <div>Sign out</div>
};

export default signout;