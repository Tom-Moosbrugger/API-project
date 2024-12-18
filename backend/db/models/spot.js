'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    static associate(models) {
      // define association here
      Spot.hasMany(models.Review, {
        foreignKey: 'spotId',
        onDelete: 'CASCADE',
        hooks: true
      });

      Spot.hasMany(models.SpotImage, {
        foreignKey: 'spotId',
        onDelete: 'CASCADE',
        hooks: true
      });

      Spot.hasMany(models.Booking, {
        foreignKey: 'spotId',
        onDelete: 'CASCADE',
        hooks: true
      });

      Spot.belongsTo(models.User, {
        as: 'Owner',
        foreignKey: 'ownerId',
      });
    }
  }
  Spot.init({
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(256),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    name: {
      type: DataTypes.STRING(49),
      allowNull: false,
      validate: {
        len: [2, 49]
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: true,
        min: 0
      }
    }
  }, {
    sequelize,
    modelName: 'Spot',
  });
  return Spot;
};