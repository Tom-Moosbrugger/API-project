const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');


const { Spot, Review, SpotImage , ReviewImage} = require('../../db/models');
const { Op, fn, col } = require('sequelize');


const router = express.Router();

router.delete('/:imageId', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const userId = user.id;

    const imageId = parseInt(req.params.imageId);

    const reviewImage = await ReviewImage.findByPk( imageId );

    if(reviewImage){

        const review = await Review.findByPk(reviewImage.reviewId);
        
        if (review.userId !== userId) {
          res
            .status(403)
            .json({ message: "Review must belong to the current user" });
        } else {
          await reviewImage.destroy();

          return res.status(200).json({
            message: "Successfully deleted",
          });
        }
    } else {

        return res.status(404).json({
             "message": "Review Image couldn't be found"
        });
    }  

});


module.exports = router;