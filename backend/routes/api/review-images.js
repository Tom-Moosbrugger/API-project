const express = require('express');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { requireAuth } = require('../../utils/auth');


const { Spot, Review, SpotImage } = require('../../db/models');
const { Op, fn, col } = require('sequelize');


const router = express.Router();



module.exports = router;