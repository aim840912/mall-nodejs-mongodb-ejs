const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path')
const fs = require('fs')
const PDFDocument = require('pdfkit')

exports.getProducts = (req, res, next) => {
	Product
		.find()
		.then((products) => {
			res.render('shop/product-list', {
				prods: products,
				docTitle: '產品中心',
				activeProductList: true,
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '產品中心', hasBreadcrumbUrl: false },
				],
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.getIndex = (req, res, next) => {
	Product.find()
		.then((products) => {
			res.render('shop/index', {
				prods: products,
				docTitle: '商城',
				activeShop: true,
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '商城', hasBreadcrumbUrl: false },
				],
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.getCart = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const products = user.cart.items;
			res.render('shop/cart', {
				docTitle: '購物車',
				activeCart: true,
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '購物車', hasBreadcrumbUrl: false },
				],
				cartProducts: products,
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.postAddToCart = (req, res, next) => {
	const productId = req.body.productId;

	Product
		.findById(productId)
		.then((product) => {
			return req.user.addToCart(product);
		})
		.then((result) => {
			res.redirect('/cart');
		})

		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.postCartDeleteProduct = (req, res, next) => {
	const productId = req.body.productId;

	req.user
		.deleteProductFromCart(productId)
		.then((result) => {
			res.redirect('/cart');
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.getProductDetail = (req, res, next) => {
	const productId = req.params.productId;

	Product.findById(productId)
		.then((product) => {
			res.render('shop/product-detail', {
				docTitle: '產品詳情',
				product: product,
				activeProductList: true,
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '產品中心', url: '/product-list', hasBreadcrumbUrl: true },
					{ name: '產品詳情', hasBreadcrumbUrl: false },
				],
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.postCreateOrder = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const products = user.cart.items.map((item) => {
				return { quantity: item.quantity, product: { ...item.productId._doc } };
			});

			const order = new Order({
				user: {
					email: req.user.email,
					userId: req.user._id,
				},
				products,
			});

			return order.save();
		})
		.then((result) => {
			return req.user.clearCart();
		})
		.then(() => {
			res.redirect('/checkout');
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.getCheckout = (req, res, next) => {
	Order
		.find({ 'user.userId': req.user._id })
		.then((orders) => {
			res.render('shop/checkout', {
				docTitle: '訂單管理',
				activeCheckout: true,
				orders,
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '訂單管理', hasBreadcrumbUrl: false },
				],
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.getInvoice = (req, res, next) => {
	const orderId = req.params.orderId
	const invoiceName = 'invoice' + '-' + orderId + '.pdf'
	const invoicePath = path.join('data', 'invoices', invoiceName)

	Order.findById(orderId)
		.then((order) => {
			if (!order) {
				return next(new Error('沒有匹配訂單訊息'))
			}
			if (order.user.userId.toString() !== req.user._id.toString()) {
				return next(new Error('未授權'))
			}

			// fs.readFile(invoicePath, (err, data) => {
			// 	if (err) {
			// 		next(err)
			// 	}
			// 	res.setHeader('Content-Type', 'application/pdf')
			// 	res.setHeader('Content-Disposition', `inline; filename=invoice-${orderId}.pdf`)
			// 	return res.send(data)
			// })

			// const file=fs.createReadStream(invoicePath)
			// file.on('data',(chunk)=>{

			// })
			// file.pipe(res)

			const pdfDoc = new PDFDocument()
			res.setHeader('Content-Type', 'application/pdf')
			res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`)
			pdfDoc.pipe(fs.createWriteStream(invoicePath))
			pdfDoc.pipe(res)
			pdfDoc.fontSize(25).text('Nodejs PDF')
			pdfDoc.end()
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		});
}
