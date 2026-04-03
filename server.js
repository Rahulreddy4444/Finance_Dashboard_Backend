import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to database, then start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
