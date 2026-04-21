const mongoose = require('mongoose');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

async function run() {
    try {
        const filters = {};
        const query = Product.find(filters).populate('seller', 'name phone profileImage address');
        const products = await query;
        console.log("SUCCESS:", products.length);
    } catch(err) {
        console.log("ERROR:", err);
    } finally {
        mongoose.disconnect();
    }
}
run();
