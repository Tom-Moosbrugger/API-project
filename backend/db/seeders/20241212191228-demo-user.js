'use strict';

const { User } = require('../models');
const bcrypt = require('bcryptjs');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
   User.bulkCreate([
    {
      email: 'testuser1@gmail.com',
      username: 'testuser1',
      hashedPassword: bcrypt.hashSync('password1')
    },
    {
      email: 'testuser2@gmail.com',
      username: 'testuser2',
      hashedPassword: bcrypt.hashSync('password2')
    },
    {
      email: 'testuser3@gmail.com',
      username: 'testuser3',
      hashedPassword: bcrypt.hashSync('password3')
    }
   ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Users'
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['testuser1', 'testuser2', 'testuser3'] }
    }, {}) 
  }
};
