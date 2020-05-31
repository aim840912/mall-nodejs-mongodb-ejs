const express = require('express');
const path = require('path');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
	'/add-product',
	[
		body('title').isString().isLength({ min: 3 }).trim().withMessage('標題內容必須大於3個字'),
		body('price').isFloat().withMessage('請輸入合理的產品價格'),
		body('description').isLength({ min: 5, max: 400 }).trim().withMessage('描述信息在5-400字之間'),
	],
	isAuth,
	adminController.postAddProduct
);

router.post(
	'/edit-product',
	[
		body('title').isString().isLength({ min: 3 }).trim().withMessage('標題內容必須大於3個字'),
		body('price').isFloat().withMessage('請輸入合理的產品價格'),
		body('description').isLength({ min: 5, max: 400 }).trim().withMessage('描述信息在5-400字符之间'),
	],
	isAuth,
	adminController.postEditProduct
);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

router.get('/products', isAuth, adminController.getProducts);

module.exports = router;
