'use strict';
const { Model, Validator } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // define association here
      Booking.belongsTo(models.Spot, {
        foreignKey: 'spotId'
      });

      Booking.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }
  }
  Booking.init({
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isNotInThePast(value) {
          const todaysDate = new Date().toDateString();
          const todaysTime = new Date(todaysDate).getTime();

          const bookingStartDate = new Date(value).toDateString();
          const bookingStartTime = new Date(bookingStartDate).getTime();
          
          if (bookingStartDate < todaysDate) {
            throw new Error("startDate cannot be in the past");
          }
        },
      },
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        onOrBeforeStartDate(value) {
          const bookingStartDate = new Date(this.startDate).toDateString();
          const bookingStartTime = new Date(bookingStartDate).getTime();

          const bookingEndDate = new Date(value).toDateString();
          const bookingEndTime = new Date(bookingEndDate).getTime();

          if (bookingEndTime <= bookingStartTime) {
            throw new Error("endDate cannot be on or before startDate")
          }
        }
      }, 
    },
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};