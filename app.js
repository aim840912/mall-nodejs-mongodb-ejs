const express = require('express');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const path = require('path');
const errorController = require('./controllers/error.js');
const mongoose = require('mongoose');
const User = require('./models/user');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const MONGODB_URI = 'mongodb://localhost/nodejs-shop';
const csrf = require('csurf');
const flash = require('express-flash-messages');

const app = express();
const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: 'sessions',
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
	session({
		secret: 'random secret string',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
		},
		store,
	})
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	}

	User.findById(req.session.user._id)
		.then((user) => {

			if (!user) {
				return req.session.destroy(err => {
					return res.status(404).send('找不到指定用戶，刷新頁面重新登入')
				})
			}
			req.user = user;
			next();
		})
		.catch((err) =>
			next(new Error(err)
			));
});

app.use((req, res, next) => {
	res.locals.isAuthenicated = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use(shopRoutes);
app.use(authRoutes);
app.use('/admin', adminRoutes);

app.use(errorController.get404);

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true })
	.then((result) => {
		app.listen(3000, () => {
			console.log('App listening on port 3000!');
		});
	})
	.catch((err) => console.log(err));
