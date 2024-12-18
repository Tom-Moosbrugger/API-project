const express = require('express');

const bcrypt = require('bcryptjs');

const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');

const { User } = require('../../db/models');

const router = express.Router();

const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Please provide a valid email.'),
    check('username')
      .exists({ checkFalsy: true })
      .isLength({ min: 4 })
      .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
      .not()
      .isEmail()
      .withMessage('Username cannot be an email.'),
    check('password')
      .exists({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password must be 6 characters or more.'),
    handleValidationErrors
  ];

router.post('/', validateSignup, async (req, res, next) => {
    const { username, email, password, firstName, lastName } = req.body;

    const hashedPassword = bcrypt.hashSync(password);

    const newUser = await User.create({
        username,
        email,
        hashedPassword,
        firstName,
        lastName
    });

    const safeUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
    };

    await setTokenCookie(res, safeUser);

    return res.status(201).json({
        user: safeUser
    });
});

module.exports = router;