'use strict';

const { Spot } = require('../models');


let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: "123 Disney Lane",
        city: "San Francisco",
        state: "California",
        country: "United States of America",
        lat: 37.7645358,
        lng: -122.4730327,
        name: "App Academy",
        description: "Place where web developers are created",
        price: 123,
      },
      {
        ownerId: 2,
        address: "123 Marvel Lane",
        city: "San Diego",
        state: "California",
        country: "United States of America",
        lat: 38.7645358,
        lng: -142.4730327,
        name: "Tom's place",
        description: "Place where stuff happens",
        price: 150,
      },
      {
        ownerId: 3,
        address: "123 DC Lane",
        city: "Los Angeles",
        state: "California",
        country: "United States of America",
        lat: 79.7645358,
        lng: -100.4730327,
        name: "Mehwish's place",
        description: "Place where things happens",
        price: 250,
      }
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return await queryInterface.bulkDelete(options, {
      ownerId: { [Op.in]: [1, 2, 3] }
    }, {}) 
  }
};
