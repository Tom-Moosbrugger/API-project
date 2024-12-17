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

module.exports = router;