const mongoose = require('mongoose');
const mongoosePageinate = require('mongoose-paginate-v2')

const productSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		imageUrl: { type: String, required: true },
		price: { type: Number, required: true },
		description: { type: String, required: true },
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ versionKey: false }
);
productSchema.plugin(mongoosePageinate)

module.exports = mongoose.model('Product', productSchema);
