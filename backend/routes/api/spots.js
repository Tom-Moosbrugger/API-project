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