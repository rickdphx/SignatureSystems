import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import app from './app';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

/**
 * Start the server
 */
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Validate required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'SQUARE_ACCESS_TOKEN',
      'SQUARE_LOCATION_ID',
    ];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
      );
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 SignatureChair Booking API is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Domain: signaturechair.com`);
      logger.info(`Square Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      server.close(() => {
        logger.info('HTTP server closed');
      });

      await prisma.$disconnect();
      logger.info('Database disconnected');

      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', { error });
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Start the server
startServer();
