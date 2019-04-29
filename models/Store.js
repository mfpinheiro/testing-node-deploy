const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

// Define the schema to strict the properties and values
// That will be assign to our model.
const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a store name!',
	},
	slug: String,
	description: {
		type: String,
		trim: true,
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now,
	},
	location: {
		type: {
			type: String,
			default: 'Point',
		},
		coordinates: [
			{
				type: Number,
				required: 'You must supply coordinates!',
			},
		],
		address: {
			type: String,
			required: 'You must supply an address!',
		},
	},
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You must supply an  author',
	},
}, {
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

// Define our indexes
// This fields are indexed by text and
// This search will be optimize
storeSchema.index({
	name: 'text',
	description: 'text',
});

storeSchema.index({
	location: '2dsphere',
});

storeSchema.pre('save', async function(next) {
	if (!this.isModified('name')) {
		next(); // skip
		return; // stop this function from running
	}
	this.slug = slug(this.name);
	// make a regEx for updating the equals name
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const storesWithSlug = await this.constructor.find({
		slug: slugRegEx,
	});
	if (storesWithSlug.length) {
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
	}
	next();
	// Todo make more resiliant so slugs are unique
});

// Bound to the model
storeSchema.statics.getTagsList = function() {
	return this.aggregate([
		{ $unwind: '$tags' },
		{
			$group: { _id: '$tags', count: { $sum: 1 } },
		},
		{ $sort: { count: -1 } },
	]);
};

storeSchema.statics.getTopStores = function () {
	return this.aggregate([
		// Lookup stores and populate their reviews
		{ $lookup: {
			from: 'reviews', localField: '_id', 
			// Same thing as a virtual
			foreignField: 'store', as: 'reviews'
		}},
		// filter for only items that have 2 or more reviews
		{ $match: { 
			'reviews.1': {
				$exists: true
			}
		}},
		// Add the average reviews fields
		{ $project: {
			// Added because of 3.2 version
			photo: '$$ROOT.photo',
			name: '$$ROOT.name',
			reviews: '$$ROOT.reviews',
			slug: '$$ROOT.slug',
			averageRating: {
				$avg: '$reviews.rating'
			}
		}},
		// Sort it by our new fields, highest reivews first
		{
			$sort: {
				avarageRating: -1
			}
		},
		// Limit to at most 10
		{
			$limit: 10
		}
	])
}




// find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
	ref: 'Review', // what model to link
	localField: '_id', // which field on the store
	foreignField: 'store' // which field on the review
})

function autopopulate(next) {
	this.populate('reviews');
	next();
}

storeSchema.pre('find', autopopulate)
storeSchema.pre('findOne', autopopulate)

// Export as a main object in the file.
module.exports = mongoose.model('Store', storeSchema);
