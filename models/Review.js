const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
	created: {
		type: Date,
		default: Date.now,
	},
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You must supply an author!',
	},
	store: {
		type: mongoose.Schema.ObjectId,
		ref: 'Store',
		required: 'You must supply a store!',
	},
	text: {
		type: 'String',
		required: 'You review must have a text',
	},
	rating: {
		type: Number,
		min: 1,
		max: 5,
	},
});

// Populate this fields to the object when there's a reference to it.
function autopopulate(next) {
	this.populate('author');
	next();
}
reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);
