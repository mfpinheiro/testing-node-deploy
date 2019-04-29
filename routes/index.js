const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController'); 
const reviewController = require('../controllers/reviewController');    
const { catchErrors } = require('../handlers/errorHandlers');

// Hit this URL
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/add', authController.isLoggedIn, storeController.addStore);

router.post('/add/:id', storeController.upload, storeController.resize, catchErrors(storeController.updateStore));
// Using a middleware to handle the errs with async/await
router.post('/add', storeController.upload, storeController.resize, catchErrors(storeController.createStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);

// 1. Validate the registration data

// 2. Register the user in the database

// 3. Log the user after the register
router.post('/register', userController.validateRegister, userController.register, authController.login);

router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);

router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', authController.confirmedPasswords, catchErrors(authController.update));

router.get('/map', storeController.mapPage);

router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));

router.post('/reviews/:id', authController.isLoggedIn, reviewController.addReview)

router.get('/top', catchErrors(storeController.getTopStores))

/*

API

*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));


// Do work here
// request, response, next
// router.get('/', (req, res) => {
//   const wes = {
//     name: 'Wes',
//     age: 100,
//     cool: true
//   };

//   // Send data to the browser
//   // res.send('Hey! It works!');

//   // Send data to the browser
//   // res.json(wes);

//   // Don't overlap this methods

//   // Get the values from the url query
//   // res.json(req.query);

//   //Render
//   // pass the name of the file and properties
//   res.render('hello', {
//     name: 'Mateus',
//     // Pass locals as dynamic
//     cats: req.query.cats,
//     title: 'I Love Food'
//   });

// });

// :name is the bridge between the url params and the params obj
// router.get('/reverse/:name', (req, res) => {
//   // access the params of the request.
//   const reverse = [...req.params.name].reverse().join('');
//   // sent this back
//   res.send(reverse);
// });

module.exports = router;
