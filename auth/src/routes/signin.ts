import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { Password } from '../services/password';
import { User } from '../models/user';
import { validateRequest, BadRequestError } from '@lsmticket/common';

const router = express.Router();

router.post('/api/users/signin', 
    [
        body('email')
            .isEmail()
            .withMessage('Email must be valid'),
        body('password')
            .trim()
            .notEmpty()
            .withMessage('You must supply a correct password'),
    ], validateRequest,
    async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            throw new BadRequestError('Invalid credentials');
        };

        const passwordMatch = await Password.compare(existingUser.password, password);

        if (!passwordMatch) {
            throw new BadRequestError('Invalid credentials');
        };

        const userJwt = jwt.sign(
            {
                id: existingUser.id,
                email: existingUser.email
            },
            process.env.jwt!
        );

        req.session = { jwt: userJwt };
        // req.session.jwt에 저장해야 되는데 그러면 typescript에서 에러가 나서 coding trick으로
        // jwt를 key로 하는 key value pair 객체를 만들어서 넣어준다. 그리고 이런 변화가 발생하고 
        // 그것이 저장된다면 cookie-session 에서 자동으로 response header안에 set-cookie라는 항목
        // 을 만들고 거기에 session의 변화된 값을 적어서 보내준다. (set-cookie: session=eyJq....)
        // 와 같은 식으로 말이다. 그래서 header를 자세히 보면 logout하거나 login할 시에는 항상
        // set-cookie 항목이 있는 것을 알 수 있다. 그러므로 따로 res.session에 res.session.jwt를
        // 만들어서 token을 집어넣지 않아도 자동으로 set-cookie를 통해서 정보가 왔다갔다 하게 된다.

        console.log(existingUser);
        res.status(200).send(existingUser);
    }
);

export { router as signinRouter };