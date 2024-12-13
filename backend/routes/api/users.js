const express = require('express');

const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');

const { User } = require('../../db/models');

const router = express.Router();

router.post('/', async (req, res, next) => {
    const { username, email, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password);

    const newUser = await User.create({
        username,
        email,
        hashedPassword,
    });

    const safeUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
    };

    await setTokenCookie(res, safeUser);

    return res.json({
        user: safeUser
    });
});

module.exports = router;