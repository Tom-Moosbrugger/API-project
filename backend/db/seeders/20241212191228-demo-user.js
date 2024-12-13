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
   await User.bulkCreate([
    {
      email: 'testuser1@gmail.com',
      username: 'testuser1',
      hashedPassword: bcrypt.hashSync('password1'),
      firstName: 'test1',
      lastName: 'test1'
    },
    {
      email: 'testuser2@gmail.com',
      username: 'testuser2',
      hashedPassword: bcrypt.hashSync('password2'),
      firstName: 'test2',
      lastName: 'test2'
    },
    {
      email: 'testuser3@gmail.com',
      username: 'testuser3',
      hashedPassword: bcrypt.hashSync('password3'),
      firstName: 'test3',
      lastName: 'test3'
    }
   ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Users'
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['testuser1', 'testuser2', 'testuser3'] }
    }, {}) 
  }
};
