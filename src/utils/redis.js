import redis from 'redis';

const redis = new redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});


export default redis;