import Review from "../models/Review.js";

// CREATE/UPDATE REVIEW
export const createReview = async (req, res) => {
  const { product_id, rating, comment } = req.body;
  try {
    let review = await Review.findOne({ user_id: req.user._id, product_id });
    if (review) {
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      review = await Review.create({ user_id: req.user._id, product_id, rating, comment });
    }
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET REVIEWS BY PRODUCT
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.product_id }).populate("user_id", "name");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
