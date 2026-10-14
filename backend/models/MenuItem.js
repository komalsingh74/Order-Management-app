import mongoose from 'mongoose';
import toJSONTransform from '../utils/toJSONTransform.js';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true, trim: true },
    category: { type: String, default: 'Main', trim: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { transform: toJSONTransform } }
);

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
