const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');

const { Spot, Review, SpotImage, ReviewImage, User, sequelize } = require('../../db/models');

const { Op, fn, col, literal } = require('sequelize');

const { environment } = require('../../config');

const isProduction = environment === 'production';

const router = express.Router();

const validateReviewBody = [
    check('review')
      .exists({ checkFalsy: true })
      .withMessage('Review text is required'),
    check('stars')
      .isInt({ min: 1, max: 5})
      .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
  ];

router.get('/current', requireAuth, async (req, res, next) => {
    const { id } = req.user

    let previewImageSubquery = isProduction ? 
    `(SELECT "url"
      FROM "bnb_connect_schema"."SpotImages" 
      WHERE "bnb_connect_schema"."SpotImages"."spotId" = "Spot"."id"
      AND "bnb_connect_schema"."SpotImages"."preview" = true
      LIMIT 1)` 
    : 
     `(SELECT url
      FROM SpotImages 
      WHERE SpotImages.spotId = Spot.id 
      AND SpotImages.preview = true
      LIMIT 1)`;

    const reviews = await Review.findAll({
        where: {
            userId: id
        },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            { 
                model: Spot,
                attributes: {
                    exclude: ['description', 'createdAt', 'updatedAt'],
                    include: [[literal(previewImageSubquery), "previewImage"]],
                },
                include: [{ model: SpotImage, attributes: [] }],
            },
            { 
                model: ReviewImage,
                attributes: ['id', 'url'],
            } 
        ]
    });

    res.json({
        Reviews: reviews
    });
});

router.post('/:reviewId/images', requireAuth, async (req, res, next) => {
    const { id: userId } = req.user;
    
    const reviewId = parseInt(req.params.reviewId);

    const { url } = req.body;

    let review = await Review.findByPk(reviewId, {
        include: [{ model: ReviewImage, attributes: [] }],
        attributes: {
            include: [[sequelize.fn('COUNT', sequelize.col('ReviewImages.id')), "imageCount"]]
        },
        group: ['Review.id']
    });

    if (!review) {
        res.status(404).json({ message: "Review couldn't be found" });
    }

    review = review.toJSON();

    if (review.userId !== userId) {
        res.status(403).json({ message: "Review must belong to the current user" });
    } else if (review.imageCount > 10) {
        res.status(403).json({ message: "Maximum number of images for this resource was reached" })
    } else {
        const newReviewImage = await ReviewImage.create({ 
            reviewId,
            url
         });

        res.status(201).json({
            id: newReviewImage.id,
            url: newReviewImage.url
        });
    }
});

router.put('/:reviewId', requireAuth, validateReviewBody, async (req, res, next) => {
    const { id: userId } = req.user;
    
    const reviewId = parseInt(req.params.reviewId);

    const { review, stars } = req.body;

    let updatedReview = await Review.findByPk(reviewId);

    if (!updatedReview) {
        res.status(404).json({ message: "Review couldn't be found" });
    } else if (updatedReview.userId !== userId) {
        res.status(403).json({ message: "Review must belong to the current user" });
    } else {
        updatedReview.review = review;
        
        updatedReview.stars = stars;

        await updatedReview.save();

        res.json(updatedReview);
    } 
});

router.delete('/:reviewId', requireAuth, async (req, res, next) => {
    const { id: userId } = req.user;
    
    const reviewId = parseInt(req.params.reviewId);

    let review = await Review.findByPk(reviewId);

    if (!review) {
        res.status(404).json({ message: "Review couldn't be found" });
    } else if (review.userId !== userId) {
        res.status(403).json({ message: "Review must belong to the current user" });
    } else {
        await review.destroy();

        res.json({
            message: "Successfully deleted"
        });
    } 
});

module.exports = router;