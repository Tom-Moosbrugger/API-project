'use strict';

const { SpotImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await SpotImage.bulkCreate([
      {
        spotId: 1,
        url: "image1 url",
        preview: true
      },
      {
        spotId: 2,
        url: "image2 url",
        preview: false
      },
      {
        spotId: 3,
        url: "image3 url",
        preview: false
      },
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
   options.tableName = 'SpotImages';
   const Op = Sequelize.Op;
    return await queryInterface.bulkDelete(options, {
      url: { [Op.in]: ['image1 url', 'image2 url', 'image3 url'] }
    }, {}) 
  }
};
