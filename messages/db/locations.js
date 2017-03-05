/**
 * Delivery Locations collection
 */

const mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var locationSchema = new Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
	description: String,
    openhours: {
        from: Number,
        to: Number
    },
    address: String,
    geometry: {
        lat: String,
        lng: String
    },
	owner: {
		id: String,
		name: String
	},
	picture: {
		contentType: String,
		contentUrl: String
	}
});

/**
 * Static method for find session address by id
 * @returns {function} - the Error if session wasn't found or another error occured. Otherwise return session address document or fields of projection
 */
locationSchema.statics.findById = function (id, fields, cb) {
    if (id == null || id == undefined) throw new SyntaxError('Not specified location id');
    else if (typeof fields === 'function') {
        cb = fields;
        fields = '';
    }

    return this.findOne({ id: id }, fields, function (err, location) {
        if (err) cb(err);
        else if (!location) cb(new Error('location is not found!'));
        else cb(null, location);
    });
};



locationSchema.statics.findAll = function (cb) {
    return this.find({}, function (err, locations) {
        if (err) cb(err);
        else if (!locations) cb(new Error('locations is not found!'));
        else cb(null, locations);
    });
};

locationSchema.statics.findAllByIds = function (ids, cb) {
    return this.find({ id: { $in: ids } }, function (err, locations) {
        if (err) cb(err);
        else if (!locations) cb(new Error('locations not found!'));
        else cb(null, locations);
    });
};

/**
 * Static method for adding session
 */
locationSchema.statics.add = function (location, cb) {
	let Locations = mongoose.model('Locations');
	let loc = new Locations(
		location
	);

	loc.save(function (err, location) {
		if (err) {
			console.error(err);
			return cb(err);
		}
		console.log(`Added New Location '${location.id}'`);
		return cb(null, location);
	});
};

mongoose.model('Locations', locationSchema);
