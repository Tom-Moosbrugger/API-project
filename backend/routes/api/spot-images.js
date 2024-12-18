const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');


const { Spot, Review, SpotImage } = require('../../db/models');
const { Op, fn, col } = require('sequelize');


const router = express.Router();


router.delete('/:imageId', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const ownerId = user.id;

    const imageId = parseInt(req.params.imageId);

    const spotImage = await SpotImage.findByPk( imageId );

    if(spotImage){

        const spot = await Spot.findByPk(spotImage.spotId);
        
        if (spot.ownerId !== ownerId) {
          res
            .status(403)
            .json({ message: "Spot must belong to the current user" });
        } else {
          await spotImage.destroy();

          return res.status(200).json({
            message: "Successfully deleted",
          });
        }
    } else {

        return res.status(404).json({
             "message": "Spot Image couldn't be found"
        });
    }  

});

module.exports = router;