const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');


const { Spot, Review, Booking , SpotImage} = require('../../db/models');
const { literal, Op, fn, col, ValidationError, where } = require('sequelize');


const router = express.Router();

router.get('/current', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const userId = user.id;

    const avgRatingSubquery = `(SELECT AVG(stars) 
                           FROM Reviews 
                           WHERE Reviews.spotId = Spot.id)`;

    const previewImageSubquery = `(SELECT url
                           FROM SpotImages 
                           WHERE SpotImages.spotId = Spot.id 
                           AND SpotImages.preview = true
                           LIMIT 1)`;

    const bookings = await Booking.findAll({
      include: [
        {
          model: Spot,
          attributes: {
            include: [
              [literal(avgRatingSubquery), "avgRating"],
              [literal(previewImageSubquery), "previewImage"],
            ],
            exclude: ["description"], 
          }
        },
      ],
      where: {
        userId,
      },
    });                       

    res.status(200).json( {
        Bookings: bookings
    });
});

module.exports = router;