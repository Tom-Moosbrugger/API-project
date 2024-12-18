'use strict';

const { Booking } = require('../models');

let options = {};

if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Booking.bulkCreate([
      {
        spotId: 1,
        userId: 2,
        startDate: '2025-02-10',
        endDate: '2025-02-11'
      },
      {
        spotId: 2,
        userId: 1,
        startDate: '2025-02-15',
        endDate: '2025-02-16'
      },
      {
        spotId: 3,
        userId: 1,
        startDate: '2025-03-15',
        endDate: '2025-03-16'
      },
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return await queryInterface.bulkDelete(options, {
      startDate: { [Op.in]: ['2025-02-10', '2025-02-15', '2025-03-15'] }
    }, {}) 
  }
};
