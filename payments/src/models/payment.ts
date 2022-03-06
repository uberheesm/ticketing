import mongoose from 'mongoose';


interface PaymentAttrs {
    orderId: string;
    stripeId: string;
} 

interface PaymentDoc extends mongoose.Document {
    orderId: string;
    stripeId: string;
    // // 원래 아래 version property를 넣어야 한다. 왜냐하면 고객의 결제 정보를 추적하고
    // // 제대로 되었는지 확인하기 위해서인데 이번 project에서는 단 한번만 결제하고
    // // 추가 결제가 없기 때문에 굳이 version을 추가해야 할 필요가 없다. 따라서 이번
    // // 에는 version을 주석처리 하지만 실제로 사용하는 code에서는 포함하고 있어야 한다.
    // version: number;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
    build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema({
    orderId: {
        required : true,
        type: String
    },
    stripeId: {
        required : true,
        type: String
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
    return new Payment(attrs);
}

const Payment = mongoose.model<PaymentDoc, PaymentModel>('Payment', paymentSchema);

export { Payment };