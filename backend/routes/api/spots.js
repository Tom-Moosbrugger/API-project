const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');

const { Spot, Review, SpotImage, sequelize, User, ReviewImage, Booking } = require('../../db/models');


const { Op, fn, col, ValidationError, where } = require('sequelize');


const router = express.Router();

const convertDateToSeconds = date => {
    date = new Date(date).toDateString();
    return new Date(date).getTime();
};

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
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be within -90 and 90'),
    check('lng')
      .exists({ checkFalsy: true })
      .withMessage('lng is required')
      .isFloat({ min: -180, max: 180 })
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
      .isFloat({ min: 0 })
      .withMessage('Price per day must be a positive number'),
    handleValidationErrors
  ];

  const validateReviewBody = [
    check('review')
      .exists({ checkFalsy: true })
      .withMessage('Review text is required'),
    check('stars')
      .isInt({ min: 1, max: 5})
      .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
  ];

  const validateQueryParams = [
    check("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be greater than or equal to 1"),
    check("size")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Size must be between 1 and 20"),
    check("minLng")
      .optional()
      .isFloat({ min: -180, max: 180  })
      .withMessage("Minimum longitude is invalid"),
    check("maxLng")
      .optional()
      .isFloat({min: -180, max: 180 })
      .withMessage("Maximum longitude is invalid"),
    check("minLat")
      .optional()
      .isFloat({ min: -90, max: 90})
      .withMessage("Minimum latitude is invalid"),
    check("maxLat")
      .optional()
      .isFloat({ min: -90 , max: 90 })
      .withMessage("Maximum latitude is invalid"),
    check("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum price must be greater than or equal to 0"),
    check("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum price must be greater than or equal to 0"),
    handleValidationErrors
  ];

  const validateBooking = [
    check('startDate')
      .exists({ checkFalsy: true })
      .withMessage('startDate is required')
      .isDate({ format: 'YYYY-MM-DD' })
      .withMessage('Date must be in YYYY-MM-DD format')
      .custom(value => {
        const todaysDate = new Date().toISOString().slice(0,10);
        const todaysTime = convertDateToSeconds(todaysDate);

        const bookingStartTime = convertDateToSeconds(value);

        if (bookingStartTime < todaysTime) {
            throw new Error("startDate cannot be in the past")
        }

        return true;
    }),
    check('endDate')
      .exists({ checkFalsy: true })
      .withMessage('endDate is required')
      .isDate({ format: 'YYYY-MM-DD' })
      .withMessage('Date must be in YYYY-MM-DD format')
      .custom((value, { req }) => {
        const bookingStartTime = convertDateToSeconds(req.body.startDate)

        const bookingEndTime = convertDateToSeconds(value)
    
        if (bookingEndTime <= bookingStartTime) {
          throw new Error("endDate cannot be on or before startDate")
        }

        return true;
      }),
    handleValidationErrors
  ];

router.get('/:spotId/reviews', async (req, res, next) => {
    const spotId = parseInt(req.params.spotId);

    const reviews = await Review.findAll( {
        where: { spotId },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ]       
    });

    if(reviews.length){
        res.status(200).json({
            Reviews: reviews
        });
    } else {
        return res.status(404).json({
            "message": "Spot couldn't be found"
       });
    }

});  

router.get('/:spotId/bookings', requireAuth, async (req, res, next) => {
    const { id: userId } = req.user;
    
    const spotId = parseInt(req.params.spotId);

    const spot =  await Spot.findByPk(spotId, { attributes: ['ownerId']});

    if (!spot) res.status(404).json({ message: "Spot couldn't be found" });

    if (userId !== spot.ownerId) {
        const bookings = await Booking.findAll({
            where: { spotId },
            attributes: ['spotId', 'startDate', 'endDate']
        });

        res.json({
            Bookings: bookings
        });
    } else {
        const bookings = await Booking.findAll({
            where: { spotId },
            include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }]
        });

        res.json({
            Bookings: bookings
        });
    }
});

router.get('/current', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const ownerId = user.id;

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
        },
        where: {
            ownerId
        },
        group: ['Spot.id', 'SpotImages.url']        
    });

    res.status(200).json( {
        Spots: spots
    });
});

router.get('/:spotId', async (req, res, next) => {
    
    const spotId = parseInt(req.params.spotId);

    const spot = await Spot.findOne( {
        where: { id: spotId},
        include: [
            {
                model: Review,
                attributes: []
            },
            {
                model: User,
                as: 'Owner',
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: SpotImage,
                attributes: ['id', 'url', 'preview']
            }
        ],
        attributes: {
            include: [
                [ sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgStarRating' ],
                [ sequelize.fn('COUNT', sequelize.col('Reviews.id')), 'numReviews' ]
            ]
        },
        group: ['Spot.id', 'Owner.id', 'SpotImages.id']        
    });

    if(spot){
        res.status(200).json( spot );
    } else {
        return res.status(404).json({
            "message": "Spot couldn't be found"
       });
    }    

});

router.get('/', validateQueryParams, async (req, res, next) => {

    const query = {
        where: { }
    };
    
    let {page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

    page = ( page === undefined ) ? 1 : parseInt(page) ; 
    size = ( size === undefined ) ? 20 : parseInt(size);
         
    if (minLat) query.where.minLat = parseFloat(minLat);
    if (maxLat) query.where.maxLat = parseFloat(maxLat);
    if (minLng) query.where.minLng = parseFloat(minLng);
    if (maxLng) query.where.maxLng = parseFloat(maxLng);
    if (minPrice) query.where.minPrice = parseFloat(minPrice);
    if (maxPrice ) query.where.maxPrice = parseFloat(maxPrice);

    // const limit = size;
    // const offset = size * (page - 1);
    query.limit = size;
    query.offset = size * (page - 1);

    console.log(page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice , query.offset);

    const spots = await Spot.findAll( {
        query,
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
        },
        group: ['Spot.id', 'SpotImages.url']        
    });

    res.json( {
        Spots: spots,
        page,
        size
    });
});

router.post('/:spotId/reviews', requireAuth, validateReviewBody, async (req, res, next) => {
    const userId = req.user.id;

    const spotId = parseInt(req.params.spotId);

    const { review, stars } = req.body;

    const spot = await Spot.findByPk(spotId, {
        include: [
            { 
                model: Review, 
                where: { userId },
                required: false ,
            }
        ],
    });

    if (!spot) {
        res.status(404).json({ message: "Spot couldn't be found" });
    } else if (spot.Reviews.length > 0) {
        res.status(500).json({ message: "User already has a review for this spot"});
    } else {
        const newReview = await Review.create({
            spotId,
            userId,
            review,
            stars
        });

        res.status(201).json(newReview);
    }

    res.json('test')
})


router.post('/:spotId/images', requireAuth, async (req, res, next) => { 
    const { user } = req;    
    const ownerId = user.id;

    const spotId = parseInt(req.params.spotId);
    const { url, preview } = req.body;

    const spot = await Spot.findByPk( spotId );

    if(spot){
        if (spot.ownerId !== ownerId) {
          res
            .status(403)
            .json({ message: "Spot must belong to the current user" });
        } else {
          const newSpotImage = await SpotImage.create({
            spotId: spot.id,
            url,
            preview,
          });

          return res.status(201).json({
            id: newSpotImage.id,
            url: newSpotImage.url,
            preview: newSpotImage.preview,
          });
        }  
    } else {
        return res.status(404).json({
             "message": "Spot couldn't be found"
        });
    }      
});

router.post('/:spotId/bookings', requireAuth, validateBooking, async (req, res, next) => {
    const { id: userId } = req.user;
    
    const spotId = parseInt(req.params.spotId);

    const { startDate, endDate } = req.body;

    const proposedStartDate = convertDateToSeconds(startDate);

    const proposedEndDate = convertDateToSeconds(endDate);

    let spot = await Spot.findByPk(spotId, {
        include: [{ model: Booking, attributes: ['startDate', 'endDate'] }]
    });

    if (!spot) return res.status(404).json({ message: "Spot couldn't be found" });
    
    if (spot.ownerId === userId) return res.status(403).json({ message: "User can't book a spot they own" });

    const errors = {}

    for (let booking of spot.Bookings) {
        const bookingStartDate = convertDateToSeconds(booking.startDate)

        const bookingEndDate = convertDateToSeconds(booking.endDate)

        if (proposedStartDate >= bookingStartDate && proposedStartDate <= bookingEndDate) {
            errors.startDate = "Start date conflicts with an existing booking";
        }

        if (proposedEndDate >= bookingStartDate && proposedEndDate <= bookingEndDate) {
            errors.endDate = "End date conflicts with an existing booking";
        }
    }

    if (errors.startDate || errors.endDate) {
        return res.status(403).json({
            message: "Sorry, this spot is already booked for the specified dates",
            errors: errors
        });
    }

    const newBooking = await Booking.create({
        spotId,
        userId,
        startDate,
        endDate
    });
    
    res.status(201).json(newBooking);
});

router.post('/', requireAuth, validateSpot, async (req, res, next) => {
    const { user } = req;

    const newSpot = await Spot.create({
        ownerId: user.id,
        ...req.body
    });
    
    res.status(201).json(newSpot);

});

router.put('/:spotId', requireAuth, validateSpot, async (req, res, next) => {
    const { user } = req;    
    const ownerId = user.id;

    const spotId = parseInt(req.params.spotId);
    const { address, city, state, country, lat, lng, name, description, price} = req.body;

    console.log(address, city, state, country, lat, lng, name, description, price)
    
    const spot = await Spot.findByPk( spotId );
    if(spot){
        if (spot.ownerId !== ownerId) {
          res
            .status(403)
            .json({ message: "Spot must belong to the current user" });
        } else {
          spot.address = address;
          spot.city = city;
          spot.state = state;
          spot.country = country;
          spot.lat = lat;
          spot.lng = lng;
          spot.name = name;
          spot.description = description;
          spot.price = price;

          await spot.save();

          return res.status(200).json(spot);
        }

    } else {
        return res.status(404).json({
             "message": "Spot couldn't be found"
        });
    } 

});


router.delete('/:spotId', requireAuth, async (req, res, next) => {
    const { user } = req;    
    const ownerId = user.id;

    const spotId = parseInt(req.params.spotId);

    const spot = await Spot.findByPk( spotId );

    if(spot){
        if (spot.ownerId !== ownerId) {
          res
            .status(403)
            .json({ message: "Spot must belong to the current user" });
        } else {
          await spot.destroy();

          return res.status(200).json({
            message: "Successfully deleted",
          });
        }
    } else {

        return res.status(404).json({
             "message": "Spot couldn't be found"
        });
    }  

});


module.exports = router;