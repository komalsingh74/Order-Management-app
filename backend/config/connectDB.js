import mongoose from 'mongoose';

// const connectDB = (uri) => mongoose.connect(uri);
const connectDB = async (uri) => {
  await mongoose.connect(uri);
  console.log("DB connected successfully");
};

export default connectDB;

const disconnectDB = () => mongoose.disconnect();

export { connectDB, disconnectDB };