import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import * as _cluster from 'cluster';
const cluster = _cluster as unknown as _cluster.Cluster;
import * as os from 'os';
import * as process from 'process';
import { app } from './app';

export async function startCluster() {
  const clusterEnabled = process.env.CLUSTER_ENABLED === 'true';
  const numWorkers = os.cpus().length;

  if (!clusterEnabled) {
    console.log('Cluster mode disabled - running in single process');
    await app();
    return;
  }

  if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork();

      worker.on('message', (message) => {
        console.log(
          `Message from worker ${worker.process.pid}: ${JSON.stringify(message)}`,
        );
      });

      worker.on('exit', (code, signal) => {
        console.log(
          `Worker ${worker.process.pid} died with code ${code} signal ${signal}`,
        );
        cluster.fork(); // restart worker
      });
    }

    const shutdown = () => {
      console.log('Master shutting down, killing all workers...');

      const workerIds = cluster.workers ? Object.keys(cluster.workers) : [];
      let remaining = workerIds.length;

      if (remaining === 0) process.exit(0);

      workerIds.forEach((id) => {
        const worker = cluster.workers![id];
        if (!worker) return;
        worker.on('exit', () => {
          remaining--;
          if (remaining === 0) process.exit(0);
        });
        worker.kill('SIGTERM');
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } else {
    console.log(`Worker ${process.pid} started`);
    app(); // each worker starts the NestJS app
  }
}

// Start clustering
startCluster()
  .then(() => console.log('Cluster started'))
  .catch((error) => console.error('Error starting cluster:', error));
