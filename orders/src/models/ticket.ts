import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { Order, OrderStatus } from './order';

// 참고로 mongoDB에 접근하기 위해서는 kubectl exec -it [kubernetes pod] mongo
// 를 치면 해당 pod에 접근 할 수 있는 terminal이 생성된다. 그리고 나서 show dbs나 
// db.[database name] 같은 mongoDB 명령어를 입력해서 database에 접근할 수 있다.

interface TicketAttrs { 
    id: string; 
    title: string;
    price: number;
}

// version: number를 추가한 것은 mongoose-update-if-current 모듈로 각
// mongoDB의 document마다 version number를 부여해서 concurrency issue
// 를 관리하기 위해서이다.
export interface TicketDoc extends mongoose.Document {
    title: string;
    price: number;
    version: number;
    isReserved():Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
    build(attrs: TicketAttrs): TicketDoc;
    findByEvent(event: { id:string, version:number }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema<TicketDoc>({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

// methods 와 statics 차이점 정리 :
// methods에서는 this가 호출한애를 가리킵니다 예를들어 asdf.findByToken 이렇게 호출했다면
// this= asdf가 되구요 statics는 this가 모델 그 자체를 가리킵니다 즉 statics에서 this는 
// mongoose 모델을 가리킵니다 findByToken에서 statics으로 해야 하는 이유는
// findOne은 mongoose 모델에서 작동하는 함수이기 때문입니다

ticketSchema.statics.build = (attrs: TicketAttrs) => {
    // mongoDB에서 id는 _id로 저장이 된다. 그런데 mongoDB에서 data를 꺼내서 다른 곳으로 
    // 보낼때 json 형식으로 변환되는데 이때는 _id가 id로 변환이 된다. 하지만 id로 보내진
    // data를 받아서 mongoDB에 저장하면 id는 그대로 id로 저장되고 받은 곳의 mongoDB가 
    // 랜덤하게 _id에 값을 생성하여 할당한다. 따라서 id를 _id로 변환해야 동일 id 값을
    // 유지할 수 있다.
    return new Ticket({
        _id: attrs.id,
        title: attrs.title,
        price: attrs.price
    })
};

// Ticket.findOne 에서 version: event.version - 1 을 쓴 이유는 version이 자연수 1만큼
// 증가해야 하며 중간에 빈숫자가 있어서는 안된다. 예를 들어 1,2,3,4... 이런 식으로 가야지
// 1,2,4,5.. 와 같이 중간에 3이 빠지면 안된다는 것이다. 그래서 항상 listener가 메세지를
// 받으면 id를 확인하면서 바로 이전 버전이 있었는지 event.version - 1로 함께 확인함으로써
// 바로 이전 version이 존재하는지 확인하고 중간에 하나도 빠지지 않고 연속되도록 관리한다.
// 이렇게 함으로써 microservice의 concurrency issue 를 피할수 있다.
ticketSchema.statics.findByEvent = (event: { id:string, version:number }) => {
    return Ticket.findOne({
        _id: event.id,
        version: event.version - 1
    });
};

// // mongoose-update-if-current에서 원래는 versionKey로 version을 관리하지만 직관적이지
// // 못해서 보다 직관적인 version으로 이름을 수정하였다. 그리고 plugin 메서드로 
// // mongoose-update-if-current를 사용할 수 있게 mongoose에 적용하였다.
ticketSchema.set('versionKey', 'version');
ticketSchema.plugin(updateIfCurrentPlugin);

// 아래 주석처리한 코드는 ticket-updated-listener.ts에서 볼 수있는 코드 두줄과 마찬가지로 
// mongoose-update-if-current 모듈 없이 수동으로 해당 모듈의 기능을 직접 만들어서 적용
// 시키는 코드이다. 바로 위의 ticketSchema.plugin(updateIfCurrentPlugin); 코드는 모듈을
// 적용시키지 않으므로 없애버리고 ticketSchema.set('versionKey', 'version'); 만 사용하고
// ticketSchema.pre(...) 을 추가한다. 그리고 //@ts-ignore 부분은 $where을 typescript가
// 이해하지 못해서 에러를 계속 뿜어내므로 이 문제를 해결하기 위해서 붙인 것이다. 
// this.$where = ... 코드는 mongoDB에 save 하기 직전에 추가로 덧붙이는 것인데 $where에서
// 보듯이 어디에 해당 코드를 저장하는지 관련된 내용이다. ticket-updated-listener.ts에서
// tickets서버에서 온 updated version number를 받아서 할당했기 때문에 현재 schmea의 version
// number는 mongoDB의 version number보다 1이 크다. 그래서 현재 version 보다 1이 작은 version
// 을 찾아서 거기에 overwrite해야 하기 때문에 현재 version에서 1을 빼준다. 정리하자면 해당코드
// 는 save operation전에 record를 찾기 위해서 추가로 criteria를 더해주는 것이다.
// ticketSchema.set('versionKey', 'version');
// ticketSchema.pre('save', function(done) {
//     //@ts-ignore
//     this.$where = { version: this.get('version') - 1 };
//     done();
// });

ticketSchema.methods.isReserved = async function () {
    const existingOrder = await Order.findOne({
        // 아래와 같이 as 를 쓰고 그 다음에 type을 써서 지정해주는 경우를 type casting
        // 이라고 부르며 강제로 형태를 변환해주는 것이다. type casting에는 다음의 두가지
        // 방식이 있다. let a: typeA; 일 경우 (1) let b = a as typeB; (2) let b = <typeB>a;
        // https://eotkd4791.github.io/typescript/TypeScript06/
        // https://www.typescripttutorial.net/typescript-tutorial/type-casting/

        ticket: this as any,
        status: {
            // 아래 $in을 보면 $기호 뒤에 연산자가 온다. mongoDB에서 값 뒤에 $가 올 경우  
            // 그 값은 변수로써 그 값의 조건에 해당하는 값을 불러오라는 뜻이다.
            // https://docs.mongodb.com/manual/reference/operator/query/in/
            // https://github.com/bestdevhyo1225/dev-log/blob/master/MongoDB/Mongoose-statics-methods.md
            $in: [
                OrderStatus.Created,
                OrderStatus.AwaitingPayment,
                OrderStatus.Complete
            ]
        }
    });

    // 느낌표 두개는 다른 타입의 데이터를 boolean 타입으로 명시적으로 형변환을 하기 위해서 사용한다.
    // 그래서 느낌표 두개 연산의 결과는 무조건 true 아니면 false이다.
    // 왜냐하면 기존의 느낌표 연산자는 true를 false로, false를 true로 반전하는 기능을 가지고 있는데 
    // 느낌표 두개 연산은 반전에 반전을 거듭하는 형태이므로 undefined나 null 값을 false로 불리언
    // 형변환하는데에 사용할 수가 있는 것이다. 
    return !!existingOrder;
};

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };

// 아래는 mongoose-update-if-current 모듈의 version관련 부분이다. 해당 모듈은 timestamp와 version 두가지 모드가
// 있는데 우리가 지금 사용하는 version 관련해서는 아래 코드를 따른다.
// export function versionOCCPlugin(schema) {
//     if (schema.$implicitlyCreated) {
//       // Implicit creation mean that it's an internal model, aka subdocument.
//       // In this case, we don't want to add hooks, because methods are not existing and it's not relevant.
//       return;
//     }
//     // Get version key name
//     const versionKey = schema.get('versionKey');
//     assert(versionKey, 'document schema must have a version key');
  
//     // Add pre-save hook to check version
//     schema.pre('save', function(next) {
//       // Condition the save on the versions matching
//       this.$where = {
//         ...this.$where,
//         [versionKey]: this[versionKey],
//       };
  
//       // Increment the version atomically
//       this.increment();
  
//       // Invoke next hook
//       next();
//     });
//   }