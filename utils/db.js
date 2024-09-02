import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
    const port = process.env.DB_PORT ? process.env.DB_PORT : '27017';
    const database = process.env.DB_DATABASE ? process.env.DB_DATABASE : 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;
    this.connected = false;
    this.client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    (async () => {
      try {
        await this.client.connect();
        this.db = this.client.db(database);
        this.connected = true;
      } catch (err) {
        console.log(err);
        this.connected = false;
      }
    })();
  }

  isAlive() {
    return (this.connected);
  }

  async nbUsers() {
    let documentUser = null;
    try {
      const userCollection = this.db.collection('users');
      documentUser = await userCollection.countDocuments();
    } catch (err) {
      console.log(err);
    }
    return documentUser;
  }

  async nbFiles() {
    let fileDocument = null;
    try {
      const fileCollection = this.db.collection('files');
      fileDocument = await fileCollection.countDocuments();
    } catch (err) {
      console.log(err);
    }
    return fileDocument;
  }
}

const dbClient = new DBClient();

export default dbClient;
