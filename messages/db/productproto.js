/**
 * Product Prototype Collection (from which we take product parameters)
 */

const mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var productprotoSchema = new Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
	description: String,
	owner: {
		id: String,
		name: String
	},
	category: String,
    type: String,
	isactive: Boolean,
	price: Number,
	qtymax: {
        type: Number,
        default: 1
    },
	forms: [{
		isactive: Boolean,
		id: String,
		name: String,
		weightmax: Number,
		weightmin: Number
	}],
	expperiod: Number,
	picture: {
		contentType: String,
		contentUrl: String
	},
	promt: String
});

/**
 * Static method for find session address by id
 * @returns {function} - the Error if session wasn't found or another error occured. Otherwise return session address document or fields of projection
 */
productprotoSchema.statics.findById = function (id, fields, cb) {
	if (id == null || id == undefined) throw new SyntaxError('Not specified proto id');
	else if (typeof fields === 'function') {
		cb = fields;
		fields = '';
	}

	return this.findOne({ id: id }, fields, function (err, prototype) {
		if (err) cb(err);
		else if (!prototype) cb(new Error('Proto is not found!'));
		else cb(null, prototype);
	});
};

productprotoSchema.statics.findAll = function (cb) {
    return this.find({}, function (err, prototypes) {
        if (err) cb(err);
        else if (!prototypes) cb(new Error('Proto is not found!'));
        else cb(null, prototypes);
    });
};

/**
 * Static method for adding session
 */
productprotoSchema.statics.add = function (productproto, cb) {
	let ProductProtos = mongoose.model('ProductProtos');
	let proto = new ProductProtos(
		productproto
	);

	proto.save(function (err, prototype) {
		if (err) {
			console.error(err);
			return cb(err);
		}
		console.log(`Added New Product Prototype '${prototype.id}'`);
		return cb(null, prototype);
	});
};

mongoose.model('ProductProtos', productprotoSchema);
