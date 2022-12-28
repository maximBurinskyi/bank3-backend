const { Shema, model, Schema} = require('mongoose');
const User = require('./User');

const TransactionSchema = new Schema({
    _user_id: {type: Schema.Types.ObjectId, ref: User},
    amount: {type: Number},
    purpose: {type: String},
    sender: {type: String},
    account_number: {type: Number}
    

});

module.exports = model('Transaction', TransactionSchema);