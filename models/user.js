const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	email: { type: String, required: true },
	password: { type: String, required: true },
	resetToken: String,
	resetTokenExpiration: Date,
	cart: {
		items: [
			{
				productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
				quantity: { type: Number, required: true },
			},
		],
	},
});

userSchema.methods.addToCart = function (product) {
	// 需要找到購物車项目中当前產品的下标位置
	const cartProductIndex = this.cart.items.findIndex((item) => {
		return item.productId.toString() === product._id.toString();
	});

	// 設置初始的產品购买数量
	let newQuantity = 1;
	// 将原来的購物車清单进行重新的赋值操作
	const updatedCartItems = [...this.cart.items];

	// 如果购买的商品并没有存在于原来的購物車清单当中
	if (cartProductIndex === -1) {
		// 添加新的產品，并且productId，购买数量则为默认
		updatedCartItems.push({
			productId: product._id,
			quantity: newQuantity,
		});
	} else {
		// 已经加入过購物車，需要将原来下标的產品购买数量+1
		newQuantity = this.cart.items[cartProductIndex].quantity + 1;
		updatedCartItems[cartProductIndex].quantity = newQuantity;
	}

	// 設置購物車购买的產品列表清单项
	const updatedCart = {
		items: updatedCartItems,
	};

	this.cart = updatedCart;

	return this.save();
};

userSchema.methods.deleteProductFromCart = function (productId) {
	const updatedCartItems = this.cart.items.filter((item) => {
		return item.productId.toString() !== productId.toString();
	});

	this.cart.items = updatedCartItems;

	return this.save();
};

userSchema.methods.clearCart = function () {
	this.cart = { items: [] };
	return this.save();
};

module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const ObjectID = mongodb.ObjectID;

// class User {
// 	constructor(name, email, cart, id) {
// 		this.name = name;
// 		this.email = email;
// 		this.cart = cart;
// 		this.id = id;
// 	}

// 	save() {
// 		const db = getDb();
// 		return db.collection('users').insertOne(this);
// 	}

// 	addToCart(product) {
// 		const db = getDb();

// 		// 需要找到購物車项目中当前產品的下标位置
// 		const cartProductIndex = this.cart.items.findIndex((item) => {
// 			return item.productId.toString() === product._id.toString();
// 		});

// 		// 設置初始的產品购买数量
// 		let newQuantity = 1;
// 		// 将原来的購物車清单进行重新的赋值操作
// 		const updatedCartItems = [...this.cart.items];

// 		// 如果购买的商品并没有存在于原来的購物車清单当中
// 		if (cartProductIndex === -1) {
// 			// 添加新的產品，并且productId，购买数量则为默认
// 			updatedCartItems.push({
// 				productId: new ObjectID(product._id),
// 				quantity: newQuantity,
// 			});
// 		} else {
// 			// 已经加入过購物車，需要将原来下标的產品购买数量+1
// 			newQuantity = this.cart.items[cartProductIndex].quantity + 1;
// 			updatedCartItems[cartProductIndex].quantity = newQuantity;
// 		}

// 		// 設置購物車购买的產品列表清单项
// 		const updatedCart = {
// 			items: updatedCartItems,
// 		};

// 		// 对用户信息的修改，实现的是購物車清单的更新操作，判断条件是用户的id数据
// 		return db.collection('users').updateOne({ _id: new ObjectID(this.id) }, { $set: { cart: updatedCart } });
// 	}

// 	deleteProductFromCart(productId) {
// 		const db = getDb();
// 		const updatedCartItems = this.cart.items.filter((item) => {
// 			return item.productId.toString() !== productId.toString();
// 		});

// 		return db
// 			.collection('users')
// 			.updateOne({ _id: new ObjectID(this.id) }, { $set: { cart: { items: updatedCartItems } } });
// 	}

// 	getCart() {
// 		const db = getDb();

// 		// 从用户的購物車中选出所有的產品的编号信息
// 		const productIds = this.cart.items.map((item) => item.productId);

// 		return db
// 			.collection('products')
// 			.find({ _id: { $in: productIds } })
// 			.toArray()
// 			.then((products) => {
// 				return products.map((product) => {
// 					// 将產品信息与購物車买的產品的数量内容进行合并操作
// 					const quantity = this.cart.items.find((item) => {
// 						return item.productId.toString() === product._id.toString();
// 					}).quantity;

// 					return {
// 						...product,
// 						quantity,
// 					};
// 				});
// 			});
// 	}

// 	createOrder() {
// 		const db = getDb();
// 		return this.getCart()
// 			.then((products) => {
// 				const order = {
// 					items: products,
// 					user: {
// 						_id: new ObjectID(this.id),
// 						name: this.name,
// 					},
// 				};

// 				return db.collection('orders').insertOne(order);
// 			})
// 			.then((result) => {
// 				return db
// 					.collection('users')
// 					.updateOne({ _id: new ObjectID(this.id) }, { $set: { cart: { items: [] } } });
// 			});
// 	}

// 	getOrder() {
// 		const db = getDb();
// 		return db
// 			.collection('orders')
// 			.find({ 'user._id': new ObjectID(this.id) })
// 			.toArray();
// 	}

// 	static findById(userId) {
// 		const db = getDb();
// 		return db.collection('users').findOneById({ _id: new ObjectID(userId) });
// 	}

// 	static findLastUser() {
// 		const db = getDb();

// 		return db
// 			.collection('users')
// 			.find()
// 			.limit(1)
// 			.toArray()
// 			.then((users) => {
// 				const user = users[0];
// 				return user;
// 			});
// 	}
// }

// module.exports = User;
