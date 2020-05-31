const express = require('express');
const path = require('path');
const authController = require('../controllers/auth');
const { check, body } = require('express-validator');
const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('请输入正确的電子郵件').normalizeEmail(),
        body('password', '密碼不得少於5个字符，且只能是數字或者字母').isLength({ min: 5 }).isAlphanumeric().trim(),
    ],
    authController.postLogin
);
router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('請輸入正確電子郵件')
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then((userDoc) => {
                    if (userDoc) {
                        return Promise.reject('該電子郵件已經存在')
                    }
                })
            }),
        body('password')
            .isLength({ min: 5 })
            .withMessage('密碼不得少於5')
            .isAlphanumeric()
            .withMessage('密碼為字母或者數字'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('重複密碼不一樣')
            }
            return true
        })
    ],
    authController.postSignup);

router.get('/reset', authController.getReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
