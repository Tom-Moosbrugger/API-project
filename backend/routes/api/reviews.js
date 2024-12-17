const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');

const { Spot, Review, SpotImage, ReviewImage, User, sequelize } = require('../../db/models');

const { Op, fn, col } = require('sequelize');

const router = express.Router();

router.get('/current', requireAuth, async (req, res, next) => {
    const { id } = req.user

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
                    exclude: ['createdAt', 'updatedAt'],
                }
            },
            { 
                model: ReviewImage,
                attributes: ['id', 'url'],
            } 
        ]
    });

    const spotIds = reviews.map(review => review.Spot.id);

    const spotImages = await SpotImage.findAll({
        where: {
            [Op.and]: [
                { preview: true }, 
                { id: { [Op.in]: [...spotIds] } },
            ]
        }
    });

    let updatedReviews = reviews.map(review => {
        review = review.toJSON();

        let imageIdx = spotImages.findIndex(spotImage => spotImage.spotId === review.Spot.id);

        if (imageIdx > -1) {
            review.Spot.previewImage = spotImages[imageIdx].url;
        }

        return review;
    });

    res.json({
        Reviews: updatedReviews
    });
});

router.post('/:reviewId/images', requireAuth, async (req, res, next) => {
    const { id: userId } = req.user;
    
    const { reviewId } = req.params;

    const { url } = req.body;

    let review = await Review.findByPk(+reviewId, {
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
        res.status(401).json({ message: "Review must belong to the current user" });
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
})

module.exports = router;