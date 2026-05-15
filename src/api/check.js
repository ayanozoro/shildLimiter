import express from 'express';
import shieldLimiter from '../core/limiter.js';

const router = express.Router();

const limiter = new shieldLimiter({
    windowSize: 60, // 1 minute
    maxRequests: 100, // max 100 requests per window
    blockDuration: 3600, // block for 1 hour
});


router.use((req, res, next) => {
    const apikey = req.headers['x-api-key'] || req.query.apikey || req.body.apikey;

    if (!apikey) {
        return res.status(400).json({ error: 'API key is required' });
    }
    // req.clientIp = apikey;
    next();
})

router.post('/check', async (req, res) => {
    try {

        const ip = req.body.ip || req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        req.clientIp = ip;
        const result = await limiter.check(req.clientIp);

        res.set({
            "X-RateLimit-Limit": result.limit,
            "X-RateLimit-Remaining": result.remaining,
            "X-RateLimit-Reset": result.reset,
        });

        if (!result.allowed) {
            return res.status(429).json({
                success: false,
                blocked: true,
                blacklisted: result.blacklisted,
                message: result.blacklisted
                    ? "Identifier is blacklisted"
                    : "Rate limit exceeded",
                metadata: result,
            });
        }
        return res.status(200).json({
            success: true,
            allowed: true,
            metadata: result,
        });
    } catch (err) {
        console.error('Error checking rate limit:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;