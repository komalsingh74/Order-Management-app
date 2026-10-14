import env from './config/env.js';
import { connectDB, disconnectDB } from './config/connectDB.js';
import { seedMenuIfEmpty } from './seed/seedMenu.js';
import statusSimulator from './services/statusSimulator.js';
import app from './app.js';

const start = async () => {
  await connectDB(env.mongoUri);
  await seedMenuIfEmpty();

  const server = app.listen(env.port, () => {
    console.log(`API running on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down...`);
    statusSimulator.stopAll();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
