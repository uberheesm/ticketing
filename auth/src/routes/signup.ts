import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { validateRequest, BadRequestError } from '@lsmticket/common'
import { User } from '../models/user'

const router = express.Router();

router.post('/api/users/signup', 
    [
        body('email')
            .isEmail()
            .withMessage('Email must be valid'),
        body('password')
            .trim()
            .isLength({ min:4, max: 20 })
            .withMessage('Password must be between 4 and 20 characters')
    ]
    , validateRequest,
    async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log('email already exists');
            throw new BadRequestError('email already exists');
        };

        const user = User.build({ email, password });
        await user.save();

        const userJwt = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.jwt!
        );
        // kubectl명령어를 사용해서 jwt-secret 안에 key value pair 형식으로
        // key: jwt, value: secretKey 로 만들었다. 명령어는 아래와 같다.
        // kubectl create secret generic jwt-secret --from-literal=jwt=secretKey
        
        // 위 process.env.jwt다음에 ! 표시는 ! 바로 앞 변수는 null 이나 undefined가
        // 아니라고 수동으로 표시해주는 것이다. 예상치 못한 변수가 있을 경우 complier 
        // type checker 가 위험하다고 판단하여 error 표시를 하는데 ! 표시를 하면 그 
        // error가 없어진다.
        // That's the non-null assertion operator. It is a way to tell the compiler 
        // "this expression cannot be null or undefined here, so don't complain about 
        // the possibility of it being null or undefined." Sometimes the type checker 
        // is unable to make that determination itself.

       
        req.session = { jwt: userJwt };
        // req.session.jwt = userJwt;로 하면 에러가 나서 수동으로 객체를
        // 만들고 거기에 jwt: userJwt로 key value pair를 할당하는 코딩의
        // 한 기법이다. 

        console.log('create a user');
        console.log(user);
        res.status(201).send(user);
});

export { router as signupRouter };