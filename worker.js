import Queue from 'bull';

const fileQueue = new Queue('image-thumbnail-worker', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});