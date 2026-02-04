import { Worker } from 'bullmq';
import { config } from 'dotenv';
import { processBatch } from './processors/batch-processor';

config();

const worker = new Worker(
  'batch-processing',
  async (job) => {
    console.log(`🔄 Processing job ${job.id}:`, job.name);
    
    try {
      switch (job.name) {
        case 'process-batch':
          await processBatch(job.data);
          break;
        default:
          console.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 2, // Process 2 jobs at a time
  },
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

console.log('🚀 Worker started and waiting for jobs...');
