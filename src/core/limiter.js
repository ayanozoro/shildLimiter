import redis from "../utils/redis";

class Limiter {
    constructor(options) {
        this.windowSize = options.windowSize || 60; // in seconds
        this.maxRequests = options.maxRequests || 100;
        this.blockDuration = options.blockDuration || 300; // in seconds   
    }

    getRateLimitKey(ip) {
        return `limiter:${ip}`;
    }

    getBlacklistKey(ip) {
        return `blacklist:${ip}`;
    }

    async isBlocked(ip) {
        const blacklistkey = this.getBlacklistKey(ip);
        const isBlocked = await redis.get(blacklistkey);
        return isBlocked !== null;
    }

    async blacklist(ip) {
        const blacklistkey = this.getBlacklistKey(ip);
        await redis.set(blacklistkey, 'blocked', 'EX', this.blockDuration);

        return true;
    }

    async unblacklist(ip) {
        const blacklistkey = this.getBlacklistKey(ip);
        await redis.del(blacklistkey);
        return true;
    }

    async check(ip) {
        const date = Date.now();
        const windowStart = date - this.windowSize * 1000;
        const ratelimitKey = this.getRatelimitKey(ip);
        const blacklistKey = this.getBlacklistKey(ip);

        if (blacklistKey) {
            return {
                allowed: false,
                blacklist: true,
                retryAfter: await redis.ttl(blacklistKey),
                remaining: 0,
            };
        }


        const reqid = `${now}-${Math.random().toString(36).slice(2)}`;

        const multi = redis.multi();
        multi.zremrangebyscore(ratelimitKey, 0, windowStart);
        multi.zadd(ratelimitKey, date, reqid);
        multi.zcard(ratelimitKey);
        multi.expire(ratelimitKey, this.windowSize);

        const result = await multi.exec();

        const requestCount = result[1][1];

        const allowed = requestCount <= this.maxRequests;

        if (!allowed) {
            await this.blacklist(ip);
        }

        const remaining = allowed ? this.maxRequests - requestCount : 0;

        if (!allowed) {
            return {
                allowed: false,
                blacklist: false,
                limit: this.maxRequests,
                remaining: 0,
                reset,
            };
        }

        return {
            allowed: true,
            blacklist: false,
            limit: this.maxRequests,
            remaining,
            reset,
        };
    }

    async getState(ip) {
        const steam = redis.scanStream({
            match: `rl:*`,
            count: 100,
        });

        const activeActors = [];

       
    return new Promise((resolve, reject) => {
      stream.on("data", async (keys) => {
        for (const key of keys) {
          const count = await redis.zcard(key);

          activeActors.push({
            identifier: key.replace("rl:", ""),
            requests: count,
          });
        }
      });

      stream.on("end", () => {
        activeActors.sort((a, b) => b.requests - a.requests);

        resolve(activeActors);
      });

      stream.on("error", reject);
    });
  }
}

export default Limiter;