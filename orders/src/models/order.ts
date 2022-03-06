import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { OrderStatus } from '@lsmticket/common';
import { TicketDoc } from './ticket';

export { OrderStatus }

interface OrderAttrs {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: TicketDoc;
}

interface OrderDoc extends mongoose.Document {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: TicketDoc;
    version: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },

    status: { 
        type: String, 
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created
    },
    // 사용자가 주문을 해서 돈을 지불하면 티켓을 사고 그 오더는 영원히 기록에 남기 때문에
    // expire가 존재하지 않는다. 그러므로 required가 아니다.
    expiresAt: {
        type: mongoose.Schema.Types.Date
    },
    // ref는 Ticket document를 참조하겠다는 말이다.
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order(attrs);
};

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };