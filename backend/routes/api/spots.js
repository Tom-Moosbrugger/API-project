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


router.post('/:spotId/images', requireAuth, async (req, res, next) => { 
    const { user } = req;    
    const ownerId = user.id;

    const spotId = parseInt(req.params.spotId);
    const { url, preview } = req.body;

    const spot = await Spot.findOne( {
        where: {
            ownerId,
            id: spotId
        }
    });

    if(spot){
        const newSpotImage = await SpotImage.create({
            spotId: spot.id,
            url,
            preview
        });

      return res.status(201).json({
        id: newSpotImage.id,
        url: newSpotImage.url,
        preview: newSpotImage.preview
      });

    } else {
        // const err = new Error(`Spot couldn't be found`);
        // err.status = 404;
        // err.title = `Spot couldn't be found`;
        // err.errors = { message: `Spot couldn't be found` };
        // return next(err);

        return res.status(404).json({
             "message": "Spot couldn't be found"
        });
    }      
});


router.post('/:spotId/images', requireAuth, async (req, res, next) => { 
    const { user } = req;    
    const ownerId = user.id;

    const spotId = parseInt(req.params.spotId);
    const { url, preview } = req.body;

    const spot = await Spot.findOne( {
        where: {
            ownerId,
            id: spotId
        }
    });

    if(spot){
        const newSpotImage = await SpotImage.create({
            spotId: spot.id,
            url,
            preview
        });

      return res.status(201).json({
        id: newSpotImage.id,
        url: newSpotImage.url,
        preview: newSpotImage.preview
      });

    } else {
        // const err = new Error(`Spot couldn't be found`);
        // err.status = 404;
        // err.title = `Spot couldn't be found`;
        // err.errors = { message: `Spot couldn't be found` };
        // return next(err);

        return res.status(404).json({
             "message": "Spot couldn't be found"
        });
    }      
});

router.post('/', requireAuth, validateSpot, async (req, res, next) => {
    const { user } = req;

    const newSpot = await Spot.create({
        ownerId: user.id,
        ...req.body
    });
    
    res.status(201).json(newSpot);

});

router.delete('/:spotId', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const ownerId = user.id;

    const spotId = parseInt(req.params.spotId);

    const spot = await Spot.findOne( {
        where: {
            ownerId,
            id: spotId
        }
    });

    if(spot){
        await spot.destroy();
        
        return res.status(200).json({
        "message": "Successfully deleted"
      });

    } else {
        // const err = new Error(`Spot couldn't be found`);
        // err.status = 404;
        // err.title = `Spot couldn't be found`;
        // err.errors = { message: `Spot couldn't be found` };
        // return next(err);

        return res.status(404).json({
             "message": "Spot couldn't be found"
        });
    }  

});

module.exports = router;