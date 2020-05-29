const express = require('express');
const path = require('path');
const authController = require('../controllers/auth');
const { check } = require('express-validator');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post('/signup', check('email').isEmail(), authController.postSignup);

router.get('/reset', authController.getReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
