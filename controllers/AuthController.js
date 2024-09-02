import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');
const uuid = require('uuid');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    const baseCredentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(baseCredentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuid.v4();
    const key = `auth_${token}`;
    const duration = 24 * (60 * 60);
    const value = user._id.toString();
    redisClient.set(key, value, duration);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const user = req.header('X-Token');
    const userId = await redisClient.get(`auth_${user}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    redisClient.del(`auth_${user}`);
    return res.status(204).json({});
  }
}

export default AuthController;
