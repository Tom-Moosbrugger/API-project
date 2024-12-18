'use strict';


const { Review } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        userId: 1,
        spotId: 1,
        review: "This was an awesome spot!",
        stars: 4,
      },
      {
        userId: 2,
        spotId: 2,
        review: "This was another awesome spot!",
        stars: 5,
      },
      {
        userId: 3,
        spotId: 3,
        review: "This was just an okay spot!",
        stars: 3,
      }
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    const Op = Sequelize.Op;
    return await queryInterface.bulkDelete(options, {
      userId: { [Op.in]: [1, 2, 3] }
    }, {}) 
  }
};
