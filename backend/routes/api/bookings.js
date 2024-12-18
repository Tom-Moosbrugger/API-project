const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');


const { Spot, Review, Booking , SpotImage, User} = require('../../db/models');
const { literal, Op, fn, col, ValidationError, where } = require('sequelize');


const router = express.Router();

router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const userId = user.id;

    const bookingId = parseInt(req.params.bookingId);

    const booking = await Booking.findByPk( bookingId );

    if(booking){
        
        const spot = await Spot.findByPk(booking.spotId);
        
        if (spot.ownerId !== userId && booking.userId !== userId) {
          res.status(403).json({
            message:
              "Booking must belong to the current user or the Spot must belong to the current user",
          });
        } else {
          const todaysDate = new Date().toDateString();
          const todaysTime = new Date(todaysDate).getTime();

          const bookingStartDate = new Date(booking.startDate).toDateString();
          const bookingStartTime = new Date(bookingStartDate).getTime();

          const bookingEndDate = new Date(booking.endDate).toDateString();
          const bookingEndTime = new Date(bookingEndDate).getTime();

          if (todaysTime < bookingEndTime && todaysTime > bookingStartTime) {
            return res.status(403).json({
              message: "Bookings that have been started can't be deleted",
            });
          } else {
            await booking.destroy();

            return res.status(200).json({
              message: "Successfully deleted",
            });
          }
        }
    } else {
        return res.status(404).json({
             "message": "Booking couldn't be found"
        });
    }  

});

router.get('/current', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const userId = user.id;

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