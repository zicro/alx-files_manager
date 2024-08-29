import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.uri = `mongodb://${host}:${port}`;
    this.dbClient = new MongoClient(this.uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    this.dbClient
      .connect()
      .then(() => {
        this.db = this.dbClient.db(`${database}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  isAlive() {
    return this.dbClient.isConnected();
  }

  async nbUsers() {
    const users = this.db.collection('users');
    const numberOfUsers = await users.countDocuments();
    return numberOfUsers;
  }

  async nbFiles() {
    const files = this.db.collection('files');
    const numberOfFiles = await files.countDocuments();
    return numberOfFiles;
  }
}

const dbClient = new DBClient();
export default dbClient;
