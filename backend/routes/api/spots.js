const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');

const { Spot, Review, SpotImage, sequelize } = require('../../db/models');
const { Op, fn, col, ValidationError } = require('sequelize');

const router = express.Router();

const validateSpot = [
    check('address')
      .exists({ checkFalsy: true })
      .withMessage('Address is required'),
    check('city')
      .exists({ checkFalsy: true })
      .withMessage('City is required'),
    check('state')
      .exists({ checkFalsy: true })
      .withMessage('State is required'),
    check('country')
      .exists({ checkFalsy: true })
      .withMessage('Country is required'),
    check('lat')
      .exists({ checkFalsy: true })
      .withMessage('lat is required')
      .isInt({ min: -90, max: 90 })
      .withMessage('Latitude must be within -90 and 90'),
    check('lat')
      .exists({ checkFalsy: true })
      .withMessage('lat is required')
      .isInt({ min: -180, max: 180 })
      .withMessage('Longitude must be within -180 and 180'),
    check('name')
      .exists({ checkFalsy: true })
      .withMessage('Name is required')
      .isLength({ max: 49 })
      .withMessage('Name must be less than 50 characters'),
    check('description')
      .exists({ checkFalsy: true })
      .withMessage('Description is required'),
    check('price')
      .exists({ checkFalsy: true })
      .withMessage('Price is required')
      .isInt({ min: 0 })
      .withMessage('Price per day must be a positive number'),
    handleValidationErrors
  ];

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

router.post('/', requireAuth, validateSpot, async (req, res, next) => {
    const { user } = req;

    const newSpot = await Spot.create({
        ownerId: user.id,
        ...req.body
    });
    
    res.status(201).json(newSpot);
});

module.exports = router;