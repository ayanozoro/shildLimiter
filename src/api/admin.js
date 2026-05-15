import express from 'express';
import { checkLimiter } from '../core/limiter.js';
const router = express.Router();

const liniter = new checkLimiter({
    windowSize: 60, // 1 minute
    maxRequests: 100, // max 100 requests per window
    blockDuration: 3600, // block for 1 hour
});


router.get('/stats', async (req, res) => {
    try {
        const ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;      
        const stats = await liniter.getStats(ip);
        res.status(200).json({
            success: true,
            stats,
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/blacklist", async (req, res) => {
  try {
    const { identifier, duration } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: "Identifier required",
      });
    }

    await limiter.blacklist(identifier, duration);

    return res.json({
      success: true,
      message: `${identifier} blacklisted`,
    });
  } catch (error) {
    console.error("[BLACKLIST ERROR]", error);

    return res.status(500).json({
      success: false,
      error: "Blacklist failed",
    });
  }
});