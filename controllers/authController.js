const passport = require('passport');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mongoose = require('mongoose');
const mail = require('../handlers/mail');
const User = mongoose.model('User');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: 'Failed Login!',
	successRedirect: '/',
	successFlash: 'You now are logged in!',
});

exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You are now logged out!');
	res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
	// check auth
	if (req.isAuthenticated()) {
		next(); // Go ahead
		return; // Get out the function
	}
	req.flash('error', 'Oops you must be logged in to do that!');
	res.redirect('/login');
};

exports.forgot = async (req, res) => {
	// 1 - If the user exists
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		// Side note
		// It's not a good practice to show that there's no account for this email
		// Because other people can submit a long list untill find one
		req.flash('error', 'No account with that email exists.');
		return res.redirect('/login');
	}
	// 2 - If there's a user.
	// Set the reset tokens and expiry on their account
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordExpires = Date.now() + 3600000; // One hour from now
	await user.save();
	// 3 Send them an email with the token
	// This will be changed
	const resetUrl = `http://${req.headers.host}/account/reset/${
		user.resetPasswordToken
	}`;
	await mail.send({
		user,
		filename: 'password-reset',
		subject: 'Password Reset',
		resetUrl,
	});
	req.flash('success', `You have been emailed a password reset link`);
	// 4 redirect to login page
	res.redirect('/login');
};

exports.reset = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: {
			$gt: Date.now(),
		},
	});
	if (!user) {
		req.flash('error', 'Password reset is invlaid or has expired');
		return res.redirect('/login');
	}
	res.render('reset', { title: 'Reset Your Password' });
};

exports.confirmedPasswords = (req, res, next) => {
	if (req.body.password === req.body['password-confirm']) {
		next();
		// keepit going and exit the funciton.
		return;
	}
	req.flash('error', 'Passwords do not match!');
	res.redirect('back');
};

exports.update = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: {
			$gt: Date.now(),
		},
	});
	if (!user) {
		res.flash('error', 'Password reset is invlaid or has expired');
		return res.redirect('/login');
	}
	// Plugin Passport JS
	const setPassword = promisify(user.setPassword, user);
	// check the passworkd
	await setPassword(req.body.password);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	// Update the properties
	const updatedUser = await user.save();
	// Log user back
	await req.login(updatedUser);
	req.flash(
		'Success',
		'Nice! Your password has been reset! You are now logged in!'
	);
	res.redirect('/');
};
