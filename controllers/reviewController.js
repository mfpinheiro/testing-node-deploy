const mongoose = require('mongoose')

const Review = mongoose.model('Review')

exports.addReview = async (req, res) => {
    req.body.author = req.user._id; // logged User
    req.body.store = req.params.id; // Param in the url
    const newReview = new Review(req.body)
    await newReview.save()
    req.flash('success', 'Review Saved!')
    res.redirect('back')    
}