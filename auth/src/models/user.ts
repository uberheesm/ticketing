import mongoose from 'mongoose';
import { Password } from '../services/password';

// An interface that describes the properties that are required
// to create a new user
interface UserAttrs {
    email: string;
    password: string;
}

// An interface that describes the properties that
// a User Model has
interface UserModel extends mongoose.Model<UserDoc> {
    build(attrs: UserAttrs): UserDoc;
}

// An interface that describes the properties that
// a User Document has
interface UserDoc extends mongoose.Document {
    email: string;
    password: string;
}

// 아래 userSchema내의 type은 대문자로 적혀있는데 이것은 typescript에게
// 알려주기 위한 것이 아니라 mongoose에 입력하기 위한 정보이기 때문에
// 대문자로 적은 것이며 반드시 대문자로 적어야 한다.
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.password;
            delete ret.__v;
        }
    }
});
// 위의 toJSON은 schema에 작용하는 method로써 JSON.stringify(object)에서
// object내에 toJSON method가 있을 경우 toJSON method내의 return값으로 
// JSON.stringify(object)가 출력하는 것과 비슷하게 작동한다. 즉, toJSON 값에
// transform이라는 함수를 적용하고 그것의 두번째 properties인 ret으로 해당
// schema에 접근해서 출력할 내용을 edit할 수 있다. 물론 console.log로 찍어보면
// 원본 document는 그대로 있다. mongoose내에서 toObject도 비슷한 method이다.
// toJSON내 transform(doc, ret)에서 doc는 실제 document이고 ret는 JSON으로
// convert되어 plain object형식으로 출력되는 값이다.
// doc는 document, ret는 return의 약자이다
// https://mongoosejs.com/docs/api.html#document_Document-toJSON 참고.
// 이 것을 쓰는 이유는 db에서 sensitive한 password같은 정보나 프로그램 버전 같은 
// 쓸데 없는 정보를 사용자에게 전송하지 않기 위해서 사용한다.

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        console.log('this =', this);
        const hashed = await Password.toHash(this.get('password'));
        this.set('password', hashed);
    } 
    next();
});

// 원래 mongoose에서는 new User로만 하고 끝이다. 왜냐하면 자바스크립트만 지원하고
// 타입스크립트는 지원하지 않는다. 그래서 new User로 새사용자 만든 다음 바깥에
// 함수를 감싸고 그 함수의 인자를 타입체크하는 방식을 사용한다.
userSchema.statics.build = (attrs: UserAttrs) => {
    return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };

// 마지막에 instance를 export 한다는 점에 주의한다. 이렇게 해서 다른 파일에서 import
// 하면 동일한 instance를 이용할 수 있는데 이런 것을 싱글톤 패턴이라고 한다.