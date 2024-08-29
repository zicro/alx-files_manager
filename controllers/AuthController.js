import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const encodedCredentials = req.header('Authorization').split(' ')[1];
    const decodedCredentials = Buffer.from(
      encodedCredentials,
      'base64',
    ).toString('ascii');
    const [email, password] = decodedCredentials.split(':');
    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const hashedPassword = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex');

    const users = dbClient.db.collection('users');
    users.findOne({ email, password: hashedPassword }, async (err, user) => {
      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (userId) {
      await redisClient.del(`auth_${token}`);
      res.status(204).json({});
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

export default AuthController;
