/* eslint-disable consistent-return */
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthMiddleware {
  static async getUser(req, res, next) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (userId) {
      const user = await dbClient.db
        .collection('users')
        .findOne({ _id: ObjectID(userId) });

      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      req.user = user;
      next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export default AuthMiddleware;
