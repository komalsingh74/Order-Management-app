import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/connectDB.js';
import { resetMenu } from './seedMenu.js';

(async () => {
  try {
    await connectDB(env.mongoUri);
    const count = await resetMenu();
    console.log(`Menu reset. ${count} items inserted.`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();
