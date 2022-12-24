const { Shema, model, Schema} = require('mongoose');
const User = require('./User');

const TransactionSchema = new Schema({
    _user_id: {type: Schema.Types.ObjectId, ref: User},
    amount: {type: Number},
    purpose: {type: String},
    

});

module.exports = model('Transaction', TransactionSchema);