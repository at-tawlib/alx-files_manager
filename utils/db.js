import { MongoClient } from 'mongodb';
import { env } from 'process';
import { hashPassword } from './utils';
import { mongo } from 'mongoose';

class DBClient {
  constructor() {
    const host = env.DB_HOST || '127.0.0.1';
    const port = env.DB_PORT || '27017';
    const database = env.DB_DATABASE || 'files_manager';
    this.client = MongoClient(`mongodb://${host}:${port}/${database}`);
    this.client.connect({ useNewUrlParser: true, useUnifiedTopology: true });
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

  async userExist(email) {
    const db = this.client.db();
    const user = db.collection('users');
    return user.findOne({ email });
  }

  async createUser(email, password) {
    const db = this.client.db();
    const user = db.collection('users').insertOne({ email, password: hashPassword(password) });
    return user;
  }

  async getUser(email) {
    const db = this.client.db();
    const users = db.collection('users').find({ email }).toArray();
    if (!users.length) {
      return null;
    }
    return users[0];
  }

  async getUserById(userId) {
    const _id = new mongo.ObjectId(userId);
    const db = this.client.db();
    const users = db.collection('users').find({ _id }).toArray();
    if (!users.length) {
      return null;
    }
    return users[0];
  }
}

const dbClient = new DBClient();

export default dbClient;
