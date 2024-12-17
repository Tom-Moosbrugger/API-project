const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');

const { Spot, Review, SpotImage, sequelize } = require('../../db/models');
const { Op, fn, col, ValidationError } = require('sequelize');

const router = express.Router();

router.get('/', async (req, res, next) => {
    const spots = await Spot.findAll( {
        include: [
            {
                model: Review,
                attributes: []
            },
            {
                model: SpotImage,
                attributes: [],
                where: {
                    preview: true
                }
            }
        ],
        attributes: {
            include: [
                [ sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgRating' ],
                [ sequelize.col('SpotImages.url'), 'previewImage' ]
            ]
        }        
    });

    res.json( {
        Spots: spots
    });
});

router.post('/', requireAuth, async (req, res, next) => {
    const { user } = req;

    try {
        const newSpot = await Spot.create({
            ownerId: user.id,
            ...req.body
        });
        
        res.status(201).json(newSpot);
    } catch(err) {
        if (err instanceof ValidationError) {
            err.status = 400;
        }

        next(err);
    }
});

module.exports = router;