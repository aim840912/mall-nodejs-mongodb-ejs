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
const csrf = require('csurf');
const flash = require('express-flash-messages');
const multer = require('multer')
const dotenv = require('dotenv')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const fs = require('fs')

dotenv.config('./env')

const MONGODB_URI = process.env.MONGODB_URI

const app = express();
const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: 'sessions',
});

const csrfProtection = csrf();

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'images')
	},
	filename: function (req, file, cb) {
		const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9)
		cb(null, uniquePrefix + '-' + file.originalname)
	}
})

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true)
	} else {
		cb(false)
	}
}

app.use(helmet())
app.use(compression())

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage, fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

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
	res.locals.isAuthenicated = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

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

app.use(shopRoutes);
app.use(authRoutes);
app.use('/admin', adminRoutes);

app.use('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
	res.status(500).render('500', { docTitle: '服務器錯誤', error, isAuthenicated: req.session.isLoggedIn })
})

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true })
	.then((result) => {
		const server = app.listen(process.env.PORT || 3000, () => {
			console.log('App listening on port 3000!');
		});

		const io = require('socket.io')(server)
		io.connect('connection', (socket) => {
			console.log('client connected')
		})
	})
	.catch((err) => console.log(err));
