const Product = require('../models/product');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/fileHelper')

exports.getAddProduct = (req, res, next) => {
	res.render('admin/edit-product', {
		docTitle: '添加產品',
		activeAddProduct: true,
		breadcrumb: [
			{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
			{ name: '添加產品', hasBreadcrumbUrl: false },
		],
		editing: false,
		hasError: false,
		errorMessage: null,
		validationErrors: [],
	});
};

exports.getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;

	if (!editMode) {
		return res.redirect('/');
	}

	const productId = req.params.productId;

	Product.findById(productId)
		.then((product) => {
			if (!product) {
				return res.redirect('/');
			}

			res.render('admin/edit-product', {
				docTitle: '修改產品',
				activeProductManage: true,
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '修改產品', hasBreadcrumbUrl: false },
				],
				editing: editMode,
				product,
				hasError: false,
				errorMessage: null,
				validationErrors: [],
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.postAddProduct = (req, res, next) => {
	const title = req.body.title;
	const image = req.file;
	const description = req.body.description;
	const price = req.body.price;
	const userId = req.user;

	if (!image) {
		return res.status(422).render('admin/edit-product', {
			docTitle: '添加產品',
			breadcrumb: [
				{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
				{ name: '添加產品', hasBreadcrumbUrl: false },
			],
			editing: false,
			hasError: true,
			errorMessage: '沒有上傳圖片或者圖片格式不對',
			product: { title, price, description },
			validationErrors: [],
		});
	}

	const imageUrl = image.path
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).render('admin/edit-product', {
			docTitle: '添加產品',
			breadcrumb: [
				{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
				{ name: '添加產品', hasBreadcrumbUrl: false },
			],
			editing: false,
			hasError: true,
			errorMessage: errors.array()[0].msg,
			product: { title, imageUrl, price, description },
			validationErrors: errors.array(),
		});
	}

	const product = new Product({ title, imageUrl, price, description, userId });
	product
		.save()
		.then((result) => {
			res.redirect('/admin/products');
		})
		.catch((err) => {
			// const error = new Error(err)
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		});
};

exports.postEditProduct = (req, res, next) => {
	const productId = req.body.productId;
	const title = req.body.title;
	const image = req.file;
	const description = req.body.description;
	const price = req.body.price;

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).render('admin/edit-product', {
			docTitle: '修改產品',
			breadcrumb: [
				{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
				{ name: '修改產品', hasBreadcrumbUrl: false },
			],
			editing: true,
			hasError: true,
			errorMessage: errors.array()[0].msg,
			product: { title, price, description, _id: productId },
			validationErrors: errors.array(),
		});
	}

	Product.findById(productId)
		.then((product) => {
			if (product.userId.toString() !== req.user._id.toString()) {
				return res.redirect('/');
			}

			product.title = title;
			product.price = price;
			product.description = description;
			if (image) {
				fileHelper.deleteFile(product.imageUrl)
				product.imageUrl = image.path
			}
			product
				.save()
				.then((result) => {
					res.redirect('/admin/products');
				})
				.catch((err) => {
					const error = new Error(err)
					error.httpStatusCode = 500
					return next(error)
				});
		}).catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		});
};

exports.deleteProduct = (req, res, next) => {
	const productId = req.params.productId;

	Product.findById(productId)
		.then((product) => {
			if (!product) {
				next(new Error('產品未找到'))
			}

			fileHelper.deleteFile(product.imageUrl)

			return Product.deleteOne({ _id: productId, userId: req.user._id })
		})
		.then((result) => {
			res.json({messgae: 'success'})
		})
		.catch((err) => {
			res.json({messgae: 'fail'})
		});
}

exports.postDeleteProduct = (req, res, next) => {
	const productId = req.body.productId;

	Product.findById(productId)
		.then((product) => {
			if (!product) {
				next(new Error('產品未找到'))
			}

			fileHelper.deleteFile(product.imageUrl)

			return Product.deleteOne({ _id: productId, userId: req.user._id })
		})
		.then((result) => {
			res.redirect('/admin/products');
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		});
};

exports.getProducts = (req, res, next) => {
	Product.find({ userId: req.user._id })
		// .select('title price -_id')
		// .populate('userId', 'name -_id')
		.then((products) => {
			res.render('admin/products', {
				prods: products,
				docTitle: '產品管理',
				activeProductManage: true,
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '產品管理', hasBreadcrumbUrl: false },
				],
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		});
};
