import { MongoClient } from 'mongodb';
import { env } from 'process';
import { hashPassword } from './utils';
import { ObjectId } from 'mongodb';
import { promises } from 'fs';
import { v4 } from 'uuid';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
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
    const users = await db.collection('users').find({ email }).toArray();
    if (!users.length) {
      return null;
    }
    return users[0];
  }

  async getUserById(userId) {
    const db = this.client.db();
    const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
    return user;
  }

  async saveFile(userId, name, type, isPublic, parentId, data) {
    if (parentId !== 0) parentId = ObjectId(parentId);
    const query = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId
    };

    if (type !== 'folder') {
      const fileNameUID = v4();

      const fileDataDecoded = Buffer.from(data, 'base64');
      const path = `${FOLDER_PATH}/${fileNameUID}`;

      query.localPath = path;

      try {
        await promises.mkdir(FOLDER_PATH, { recursive: true });
        await promises.writeFile(path, fileDataDecoded);
      } catch(err) {
        return { error: err.message, code: 400 };
      }
      
      const db = this.client.db();
      const result = await db.collection('files').insertOne(query);

      const file = { id: query._id, ...query};
      delete file.localPath;
      delete file._id;

      const newFile = { id: result.insertedId, ...file };
      return newFile;
    }
  }
  async filterFiles(filters) {
    const db = this.client.db();
    const filesCollection = db.collection('files');
    // get ids and convert it to ObjectId
    const idFilters = ['_id', 'userId', 'parentId'].filter((prop) => prop in filters && filters[prop] !== '0');
    idFilters.forEach((i) => {
      filters[i] = ObjectId(filters[i]);
    });
    return filesCollection.findOne(filters);
  }
}

const dbClient = new DBClient();

export default dbClient;
