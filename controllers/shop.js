const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
	Product.find().then((products) => {
		res.render('shop/product-list', {
			prods: products,
			docTitle: '產品中心',
			activeProductList: true,
			breadcrumb: [
				{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
				{ name: '產品中心', hasBreadcrumbUrl: false },
			],
		});
	});
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
		.catch((err) => console.log(err));
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
		});
};

exports.postAddToCart = (req, res, next) => {
	const productId = req.body.productId;

	Product.findById(productId)
		.then((product) => {
			return req.user.addToCart(product);
		})
		.then((result) => {
			res.redirect('/cart');
		})
		.catch((err) => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
	const productId = req.body.productId;

	req.user
		.deleteProductFromCart(productId)
		.then((result) => {
			res.redirect('/cart');
		})
		.catch((err) => console.log(err));
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
		.catch((err) => console.log(err));
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
			console.log(err);
		});
};

exports.getCheckout = (req, res, next) => {
	Order.find({ 'user.userId': req.user._id }).then((orders) => {
		res.render('shop/checkout', {
			docTitle: '訂單管理',
			activeCheckout: true,
			orders,
			breadcrumb: [
				{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
				{ name: '訂單管理', hasBreadcrumbUrl: false },
			],
		});
	});
};
