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
      email: 'demo@user.io',
      username: 'Demo-lition',
      firstName: 'John',
      lastName: 'Doe',
      hashedPassword: bcrypt.hashSync('password')
    },
    {
      email: 'user1@user.io',
      username: 'FakeUser1',
      firstName: 'Alice',
      lastName: 'Smith',
      hashedPassword: bcrypt.hashSync('password2')
    },
    {
      email: 'user2@user.io',
      username: 'FakeUser2',
      firstName: 'Michael',
      lastName: 'Johnson',
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
