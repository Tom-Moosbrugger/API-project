const express = require('express');

const { Op } = require('sequelize');

const bcrypt = require('bcryptjs');

const { setTokenCookie, restoreUser } = require('../../utils/auth');

const { User } = require('../../db/models');

//used for validating the body of the request
const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateLogin = [
    check('credential')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('Please provide a valid email or username.'),
    check('password')
      .exists({ checkFalsy: true })
      .withMessage('Please provide a password.'),
    handleValidationErrors
];

router.get('/', (req, res) => {
    const { user } = req;

    if (user) {
        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
        };

        return res.json({
            user: safeUser
        });
    } else {
        return res.json({ user: null });
    }
});

router.post('/', validateLogin, async (req, res, next) => {
    const { credential, password } = req.body;

    const user = await User.unscoped().findOne({
        where: {
            [Op.or]: {
                username: credential,
                email: credential
            }
        }
    });

    if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
        const err = new Error('Invalid credentials');
        err.status = 401;
        err.title = 'Invalid credentials';
        err.errors = { credential: 'The provided credentials were invalid.' };
        return next(err);
    }

    const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
    };

    await setTokenCookie(res, safeUser);

    return res.json({
        user: safeUser
    });
});

router.delete('/', (_req, res) => {
    res.clearCookie('token');
    return res.json({ message: 'success' });
})

module.exports = router;