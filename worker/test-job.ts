import { Queue } from 'bullmq';
import { config } from 'dotenv';

config();

async function testJob() {
  const queue = new Queue('batch-processing', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  });

  const job = await queue.add('process-batch', {
    batchId: 1,
    zipPath: '/Users/atapia/clawd/projects/portal-nomina/storage/uploads/test-lote-2026-01-Q1.zip',
  });

  console.log('✅ Job added:', job.id);
  console.log('Waiting for processing...');

  console.log('Job added! Check worker logs for processing status.');
  
  // Give it a moment to start processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  await queue.close();
  process.exit(0);
}

testJob().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
