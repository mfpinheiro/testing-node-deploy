/** Example of the use of the middleware */
const mongoose = require('mongoose');
// Because of the Singleton pattern whe just ref the OBJ here.
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
// Handles multpart upload from our app.
const multerOptions = {
	storage: multer.memoryStorage(),
	fifleFilter(req, file, next) {
		// What type of photo is?
		const isPhoto = file.mimetype.startsWith('image/');
		if (isPhoto) {
			// continue fi it is a image
			next(null, true);
		} else {
			next(
				{
					message: "That filetype isn't allowed!",
				},
				false
			);
		}
	},
};

exports.myMiddleware = (req, res, next) => {
	req.name = 'Mateus';
	res.cookie('name', 'Mateus is cool', { maxAge: 900000 });
	next();
};

/** Creating pages example  */

exports.homePage = (req, res) => {
	res.render('index');
};

exports.addStore = (req, res) => {
	res.render('editStore', {
		title: 'Add Store',
	});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
	// check if there is no new file to resize
	if (!req.file) {
		// skip to the next middleware
		next();
		return;
	}
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// now we resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	// once we have writter the photo to our filesystem, keep going!
	next();
};

exports.createStore = async (req, res) => {
	req.body.author = req.user._id;
	const store = await new Store(req.body).save();
	req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	const page = req.params.page || 1;
	const limit = 4;
	const skip = (page * limit) - limit;
	// Query the database for a list of all stores
	const storesPromise = Store
		.find()
		.skip(skip)
		.limit(limit)
		.sort({ created: 'desc' });

	const countPromise = Store.count();

	const [stores, count] = await Promise.all([storesPromise, countPromise]);
	
	const pages = Math.ceil(count / limit);

	if (!stores.length && skip) {
		req.flash('info', `Hey you asked for page ${page}. But that doesn't exists, so I put you on page ${pages}`);
		res.redirect(`/stores/page/${pages}`);
		return;
	}

	res.render('stores', { title: 'Stores', stores, page, pages, count });
};

const confirmOwner = (store, user) => {
	if (!store.author.equals(user._id)) {
		throw Error('You must own a store in order to edit it!');
	}
};

exports.editStore = async (req, res) => {
	// Find the store given the ID
	const store = await Store.findOne({ _id: req.params.id });
	// Check if the user has permission for edit
	confirmOwner(store, req.user);
	// debugger;
	res.render('editStore', { title: `Edit  ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
	// set the location data to be a point
	req.body.location.type = 'Point';

	// find and update store
	const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
		new: true,
		runValidators: true,
	}).exec();
	req.flash(
		'success',
		`Successfully updated <strong>${store.name}</strong>. 
    <a href="/stores/${store.slug}"> View Store! </a>`
	);
	res.redirect(`/stores/${store._id}/edit`);
	// redirect them the store and tell then it worked
	res.render();
};

exports.getStoreBySlug = async (req, res, next) => {
	const store = await Store.findOne({
		slug: req.params.slug,
	}).populate('author reviews');
	if (!store) {
		return next();
	}
	res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res, next) => {
	const tag = req.params.tag;
	const tagQuery = tag || { $exists: true };
	const tagsPromise = Store.getTagsList();
	const storesPromise = Store.find({ tags: tagQuery });
	const [ tags, stores ] = await Promise.all([ tagsPromise, storesPromise ]);

	res.render('tag', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
	const stores = await Store.find(
		{
			$text: {
				$search: req.query.q, // Search the Field byt text
			},
		},
		{
			score: {
				$meta: 'textScore', // Find the score
			},
		}
	)
		.sort({
			score: {
				$meta: 'textScore', // Sort them
			},
		})
		.limit(5); // Return only limit
	res.json(stores);
};

exports.mapStores = async (req, res) => {
	const coordinates = [ req.query.lng, req.query.lat ].map(parseFloat);

	const q = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates,
				},
				// $maxDistance: 10000, // 10km
			},
		},
	};

	const stores = await Store.find(q).select('slug name description location photo').limit(10);
	res.json(stores);
};

exports.mapPage = (req, res) => {
	res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map((obj) => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User.findByIdAndUpdate(
		req.user._id,
		{
			[operator]: { hearts: req.params.id },
		},
		{ new: true }
	);
	res.json(user);
};

exports.getHearts = async (req, res) => {
	const stores = await Store.find({
		_id: { $in: req.user.hearts },
	});
	res.render('stores', { title: 'Stores Heartered', stores });
};

exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores();
	res.render('topStores', {
		stores, 
		title: '* Top Stores'
	})
}
