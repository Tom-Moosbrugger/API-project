const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');

const { Spot, Review, SpotImage, sequelize } = require('../../db/models');
const { Op, fn, col, where } = require('sequelize');

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

      return res.json({
        id: newSpotImage.id,
        url: newSpotImage.url,
        preview: newSpotImage.preview
      });

    } else {
        const err = new Error(`Spot couldn't be found`);
        err.status = 401;
        err.title = `Spot couldn't be found`;
        err.errors = { message: `Spot couldn't be found` };
        return next(err);
    }      

});

module.exports = router;