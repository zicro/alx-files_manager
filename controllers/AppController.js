import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    res
      .status(200)
      .send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      res.status(200).send({ users, files });
    } catch (error) {
      console.log(error);
      res.status(500).send();
    }
  }
}

export default AppController;
