/**
 * Product collection
 */

const mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var productSchema = new Schema({
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
    orderid: {
        type: String,
        default: 'N/A'
    },
    storageid: {
        type: String,
        default: 'N/A'
    },
    clientid: String,
    category: String,
    type: String,
    status: {
        date: Date,
        status: String
    },
	price: Number,
	size: {
		weightmax: Number,
		weightmin: Number
	},
	expperiod: Number,
	picture: {
		contentType: String,
		contentUrl: String
	}
});

/**
 * Static method for find session address by id
 * @returns {function} - the Error if session wasn't found or another error occured. Otherwise return session address document or fields of projection
 */
productSchema.statics.findById = function (id, fields, cb) {
    if (id == null || id == undefined) throw new SyntaxError('Not specified product id');
    else if (typeof fields === 'function') {
        cb = fields;
        fields = '';
    }

    return this.findOne({ id: id }, fields, function (err, product) {
        if (err) cb(err);
        else if (!product) cb(new Error('Product is not found!'));
        else cb(null, product);
    });
};



productSchema.statics.findAll = function (cb) {
    return this.find({}, function (err, products) {
        if (err) cb(err);
        else if (!products) cb(new Error('Proto is not found!'));
        else cb(null, products);
    });
};

productSchema.statics.findAllByIds = function (ids, cb) {
    return this.find({ id: { $in: ids } }, function (err, products) {
        if (err) cb(err);
        else if (!products) cb(new Error('Products not found!'));
        else cb(null, products);
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
productSchema.statics.add = function (product, cb) {
	let Products = mongoose.model('Products');
	let prod = new Products(
		product
	);

	prod.save(function (err, product) {
		if (err) {
			console.error(err);
			return cb(err);
		}
		console.log(`Added New Product '${product.id}'`);
		return cb(null, product);
	});
};

mongoose.model('Products', productSchema);
