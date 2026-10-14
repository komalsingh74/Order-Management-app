import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MenuItem from '../../models/MenuItem.js';

let mongod;

const connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

const clear = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

const close = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

const seedMenu = () =>
  MenuItem.insertMany([
    { name: 'Test Pizza', description: 'Cheesy', price: 250, image: '/menu/a.svg', category: 'Pizza' },
    { name: 'Test Burger', description: 'Juicy', price: 150.5, image: '/menu/b.svg', category: 'Burgers' },
    { name: 'Sold Out Fries', description: 'Gone', price: 99, image: '/menu/c.svg', isAvailable: false },
  ]);

export { connect, clear, close, seedMenu };
