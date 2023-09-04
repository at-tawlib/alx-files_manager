import { MongoClient } from 'mongodb';
import { env } from 'process';

class DBClient {
  constructor() {
    const host = env.DB_HOST || 'localhost';
    const port = env.DB_PORT || '27017';
    const database = env.DB_DATABASE || 'files_manager';
    this.client = MongoClient(`mongodb://${host}:${port}/${database}`);
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const db = this.client.db();
    const users = db.collection('users');
    return users.countDocuments();
  }

  async nbFiles() {
    const db = this.client.db();
    const files = db.collection('files');
    return files.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
