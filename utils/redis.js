import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.connected = true;
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      this.connected = false;
      console.log(`Redis client not connected to the server: ${err}`);
    });
    this.client.on('connect', () => { this.connected = true; });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return (this.connected);
  }

  async get(key) {
    let value = null;
    try {
      value = await this.getAsync(key);
    } catch (err) {
      console.log(err);
    }
    return value;
  }

  async set(key, value, duration) {
    try {
      await this.setAsync(key, duration, value);
    } catch (err) {
      console.log(err);
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
