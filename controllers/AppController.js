import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    const redisAlive = await redisClient.isAlive();
    const dbAlive = await dbClient.isAlive();
    return res.status(200).send({ redis: redisAlive, db: dbAlive });
  }

  static async getStats(req, res) {
    const usersNumber = await dbClient.nbUsers();
    const filesNumber = await dbClient.nbFiles();
    return res.status(200).send({ users: usersNumber, files: filesNumber });
  }
}
module.exports = AppController;
