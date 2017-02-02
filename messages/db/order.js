/**
 * Product collection
 */

const mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var orderSchema = new Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    clientinfo: {
        id: String,
        phone: String,
        fio: String
    },
    status: {
       type: String,
       default: 'UNCONFIRMED_NEW'
    },
    date: Date,
    totalprice: Number,
    isdeleted: {
        type: Boolean,
        default: false
    },
    location: String,
    products: [],
    comment: {
        type: String,
        default: 'NO_COMMENT'
    }
});

/**
 * Static method for find session address by id
 * @returns {function} - the Error if session wasn't found or another error occured. Otherwise return session address document or fields of projection
 */
orderSchema.statics.findById = function (id, fields, cb) {
    if (id == null || id == undefined) throw new SyntaxError('Not specified order id');
    else if (typeof fields === 'function') {
        cb = fields;
        fields = '';
    }

    return this.findOne({ id: id }, fields, function (err, order) {
        if (err) cb(err);
        else if (!order) cb(new Error('Order is not found!'));
        else cb(null, order);
    });
};

orderSchema.statics.findByClientId = function (id, fields, cb) {
    if (id == null || id == undefined) throw new SyntaxError('Not specified client id order');
    else if (typeof fields === 'function') {
        cb = fields;
        fields = '';
    }

    return this.findOne({ "clientinfo.id" : id }, fields, function (err, order) {
        if (err) cb(err);
        else if (!order) cb(new Error('Order is not found!'));
        else cb(null, order);
    });
};

orderSchema.statics.findAll = function (cb) {
    return this.find({}, function (err, orders) {
        if (err) cb(err);
        else if (!orders) cb(new Error('Order is not found!'));
        else cb(null, orders);
    });
};

// productprotoSchema.virtual('catOptions').get(function() {
// 	var result = {};
// 	if (this.categories) {
// 		for (var i = 0; i < this.categories.length; i++) {
// 			if (this.categories[i].isactive) {
// 				result[this.categories[i].name] = this.categories[i].id;
// 			}
// 		}
// 	}
// 	return result;
// });

/**
 * Static method for adding session
 */
orderSchema.statics.add = function (order, cb) {
	let Orders = mongoose.model('Orders');
	let ord = new Orders(
		order
	);

	ord.save(function (err, order) {
		if (err) {
			console.error(err);
			return cb(err);
		}
		console.log(`Added New Order '${order.id}'`);
		return cb(null, order);
	});
};

mongoose.model('Orders', orderSchema);
