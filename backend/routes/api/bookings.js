const express = require('express');

const { environment } = require('../../config');

const isProduction = environment === 'production';

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');


const { Spot, Review, Booking , SpotImage, User} = require('../../db/models');
const { literal, Op, fn, col, ValidationError, where } = require('sequelize');


const router = express.Router();

const convertDateToSeconds = (date) => {
  date = new Date(date).toDateString();
  return new Date(date).getTime();
};

const validateBooking = [
  check("startDate")
    .exists({ checkFalsy: true })
    .withMessage("startDate is required")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be in YYYY-MM-DD format")
    .custom((value) => {
      const todaysDate = new Date().toISOString().slice(0, 10);
      const todaysTime = convertDateToSeconds(todaysDate);

      const bookingStartTime = convertDateToSeconds(value);

      if (bookingStartTime < todaysTime) {
        throw new Error("startDate cannot be in the past");
      }

      return true;
    }),
  check("endDate")
    .exists({ checkFalsy: true })
    .withMessage("endDate is required")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be in YYYY-MM-DD format")
    .custom((value, { req }) => {
      const bookingStartTime = convertDateToSeconds(req.body.startDate);

      const bookingEndTime = convertDateToSeconds(value);

      if (bookingEndTime <= bookingStartTime) {
        throw new Error("endDate cannot be on or before startDate");
      }

      return true;
    }),
  handleValidationErrors,
];

router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const userId = user.id;

    const bookingId = parseInt(req.params.bookingId);

    const booking = await Booking.findByPk( bookingId, {
        include: [{ model: Spot, attributes: ['id','ownerId'] }]
    } );

    if(booking){        
        if (booking.Spot.ownerId !== userId && booking.userId !== userId) {
          res.status(403).json({
            message:
              "Booking must belong to the current user or the Spot must belong to the current user",
          });
        } else {          
          const todaysTime = convertDateToSeconds(new Date().toISOString().slice(0, 10));         
          const bookingStartTime = convertDateToSeconds(booking.startDate);          
          const bookingEndTime = convertDateToSeconds(booking.endDate);

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

    let previewImageSubquery = isProduction ? 
    `(SELECT "url"
      FROM "bnb_connect_schema"."SpotImages" 
      WHERE "bnb_connect_schema"."SpotImages"."spotId" = "Spot"."id"
      AND "bnb_connect_schema"."SpotImages"."preview" = true
      LIMIT 1)` 
    : 
     `(SELECT url
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
          },
          include: [{ model: SpotImage, attributes: [] }],
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


router.put('/:bookingId', requireAuth, validateBooking, async (req, res, next) => {
    const { user } = req;    
    const userId = user.id;

    const bookingId = parseInt(req.params.bookingId);
    const { startDate, endDate } = req.body;

    const proposedStartDate = convertDateToSeconds(startDate);
    const proposedEndDate = convertDateToSeconds(endDate);
    const todaysDate = convertDateToSeconds(new Date().toISOString().slice(0, 10));

    const booking = await Booking.findByPk(bookingId);

    if(booking.userId !== userId ){
        res.status(403).json({
            message:
              "Booking must belong to the current user",
          });
    }

    if(booking){
        const currBookingStartDate = convertDateToSeconds(booking.startDate);
        const currBookingEndDate = convertDateToSeconds(booking.endDate);

        if(currBookingEndDate < todaysDate){
            return res.status(403).json({ message: "Past bookings can't be modified" });
        }

        let spot = await Spot.findByPk(booking.spotId, {
          include: [{ model: Booking, attributes: ["id", "startDate", "endDate"] }],
        });
        
        const errors = {};

        if (spot && spot.Bookings && spot.Bookings.length > 0) {
          let i = 0;
        
          while (i < spot.Bookings.length ) {
            const existingBooking = spot.Bookings[i];
            if(existingBooking.id !== bookingId){
                const bookingStartDate = convertDateToSeconds(existingBooking.startDate);
                const bookingEndDate = convertDateToSeconds(existingBooking.endDate);

                if ( proposedStartDate >= bookingStartDate && proposedStartDate <= bookingEndDate ) {
                errors.startDate = "Start date conflicts with an existing booking";
                }
        
                if ( proposedEndDate >= bookingStartDate && proposedEndDate <= bookingEndDate) {
                    errors.endDate = "End date conflicts with an existing booking";
                }   
            }
            i++;             
          }
        }
        
        if (errors.startDate || errors.endDate) {
          return res.status(403).json({
            message:
              "Sorry, this spot is already booked for the specified dates",
            errors: errors,
          });
        }

        booking.startDate = startDate;
        booking.endDate = endDate;
        await booking.save();

        return res.status(200).json(booking);
        
    } else {
        return res.status(404).json({
            "message": "Booking couldn't be found"
       });
    }
    
});

module.exports = router;