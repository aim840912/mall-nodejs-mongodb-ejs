const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport({
	host: 'smtp.163.com',
	port: 465,
	secure: true,
	auth: {
		user: 'chinavane_2020@163.com',
		pass: 'EIEHJMRYZPDWZOYB',
	},
});

exports.getLogin = (req, res, next) => {
	res.render('auth/login', {
		docTitle: '用戶登入',
		breadcrumb: [
			{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
			{ name: '用戶登入', hasBreadcrumbUrl: false },
		],
		errorMessage: req.flash('error'),
	});
};

exports.postLogin = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	User.findOne({ email })
		.then((user) => {
			if (!user) {
				req.flash('error', '没有匹配的用户信息');
				return res.redirect('/login');
			}

			bcrypt
				.compare(password, user.password)
				.then((doMatch) => {
					if (doMatch) {
						req.session.isLoggedIn = true;
						req.session.user = user;
						return req.session.save((err) => {
							console.log(err);
							return res.redirect('/');
						});
					}
					req.flash('error', '用戶登入密碼的錯誤');
					res.redirect('/login');
				})
				.catch((err) => {
					console.log(err);
					return res.redirect('/login');
				});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.postLogout = (req, res, next) => {
	req.session.destroy((err) => {
		console.log(err);
		res.redirect('/');
	});
};

exports.getSignup = (req, res, next) => {
	res.render('auth/signup', {
		docTitle: '用戶註冊',
		breadcrumb: [
			{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
			{ name: '用戶註冊', hasBreadcrumbUrl: false },
		],
		errorMessage: req.flash('error'),
		oldInput: { email, password, confirmPassword },
		validationErrors: []
	});
};

exports.postSignup = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const confirmPassword = req.body.confirmPassword;

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		console.log(errors.array());

		return res.status(422).render('auth/signup', {
			docTitle: '用戶註冊',
			breadcrumb: [
				{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
				{ name: '用戶註冊', hasBreadcrumbUrl: false },
			],
			errorMessage: errors.array()[0].msg,
			oldInput: { email, password, confirmPassword },
			validationErrors: error.array()
		});
	}
	bcrypt.hash(password, 12).then((hashedPassword) => {
		const user = new User({
			email,
			password: hashedPassword,
			cart: {
				items: [],
			},
		});

		return user
			.save()
			.then(() => {
				res.redirect('/login');
				transporter.sendMail({
					from: 'chinavane_2020@163.com',
					to: email,
					subject: '註冊成功',
					html: '<b>歡迎新用戶註冊</b>',
				});
			})
			.catch((err) => {
				const error = new Error(err)
				error.httpStatusCode = 500
				return next(error)
			})
	});


};

exports.getReset = (req, res, next) => {
	res.render('auth/reset', {
		docTitle: '重置密碼',
		breadcrumb: [
			{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
			{ name: '重置密碼', hasBreadcrumbUrl: false },
		],
		errorMessage: req.flash('error'),
	});
};

exports.postReset = (req, res, next) => {
	const email = req.body.email;
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			return res.redirect('/reset');
		}

		const token = buffer.toString('hex');

		User.findOne({ email })
			.then((user) => {
				if (!user) {
					req.flash('error', '該帳號不存在');
					return res.redirect('/reset');
				}

				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 1000 * 60 * 60;

				return user
					.save()
					.then((result) => {
						res.redirect('/');

						transporter.sendMail({
							from: 'chinavane_2020@163.com',
							to: email,
							subject: '重置密碼',
							html: `
							你請求了密碼重置操作，可以點擊連結地址：
							<a href="http://localhost:3000/reset/${token}">重置链接</a>
						`,
						});
					}).catch((err) => {
						const error = new Error(err)
						error.httpStatusCode = 500
						return next(error)
					})
			})
			.catch((err) => {
				const error = new Error(err)
				error.httpStatusCode = 500
				return next(error)
			})
	});
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;

	User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
		.then((user) => {
			if (!user) {
				return res.redirect('/login');
			}

			res.render('auth/new-password', {
				docTitle: '設置新密碼',
				breadcrumb: [
					{ name: '首頁', url: '/', hasBreadcrumbUrl: true },
					{ name: '設置新密碼', hasBreadcrumbUrl: false },
				],
				userId: user._id.toString(),
				passwordToken: token,
				errorMessage: req.flash('error'),
			});
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};

exports.postNewPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const userId = req.body.userId;
	const passwordToken = req.body.passwordToken;
	let resetUser;

	User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
		.then((user) => {
			resetUser = user;
			return bcrypt.hash(newPassword, 12);
		})
		.then((hashedPassword) => {
			resetUser.password = hashedPassword;
			resetUser.resetToken = undefined;
			resetUser.resetTokenExpiration = undefined;

			return resetUser
				.save()
				.then((result) => {
					res.redirect('/login');
				})
				.catch((err) => {
					const error = new Error(err)
					error.httpStatusCode = 500
					return next(error)
				})
		})
		.catch((err) => {
			const error = new Error(err)
			error.httpStatusCode = 500
			return next(error)
		})
};
