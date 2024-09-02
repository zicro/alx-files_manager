import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
      });
    }
    if (!password) {
      return res.status(400).json({
        error: 'Missing password',
      });
    }
    const existEmail = await dbClient.db.collection('users').findOne({ email });
    if (existEmail) {
      return res.status(400).json({
        error: 'Already exist',
      });
    }
    const hashedPassword = sha1(password);
    const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
    return res.status(201).json({ id: result.insertedId.toString(), email });
  }

  static async getMe(req, res) {
    const myToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${myToken}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const _id = ObjectId(userId);
    const user = await dbClient.db.collection('users').findOne({ _id });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const data = {
      email: user.email,
      id: user._id,
    };
    return res.status(200).send(data);
  }
}

export default UsersController;
