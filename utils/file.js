import { promises } from 'fs';
import { ObjectId } from 'mongodb';
import { join } from 'path';
import { v4 } from 'uuid';
import dbClient from './db';

export const FOLDER = 'folder';
const FILE = 'file';
const IMAGE = 'image';
const VALID_FILE_TYPES = [FOLDER, FILE, IMAGE];
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const { mkdir, writeFile } = promises;

export class FilesCollection {
  constructor() {
    this.files = dbClient.filesCollection();
  }

  async findById(id) {
    return this.files.findOne({ _id: ObjectId(id) });
  }

  async addFile(file) {
    const result = await this.files.insertOne(file);
    const { _id, ...rest } = result.ops[0];
    return { id: _id, ...rest };
  }
}

export default class File {
  constructor(userId, name, type, parentId, isPublic, data) {
    this.userId = userId;
    this.name = name;
    this.type = type;
    this.parentId = parentId || 0;
    this.isPublic = isPublic || false;
    this.data = data;
    this.filesCollection = new FilesCollection();
  }

  async validate() {
    if (!this.name) return 'Missing name';
    if (!this.type || !VALID_FILE_TYPES.includes(this.type)) return 'Missing type';
    if (!this.data && this.type !== FOLDER) return 'Missing data';

    if (this.parentId) {
      const parent = await this.filesCollection.findById(this.parentId);
      if (!parent) return 'Parent not found';
      if (parent.type !== FOLDER) return 'Parent is not a folder';
    }
    return null;
  }

  async save() {
    const error = await this.validate();
    if (error) throw new Error(error);

    if (this.type === FOLDER) {
      return this.filesCollection.addFile({
        userId: ObjectId(this.userId),
        name: this.name,
        type: FOLDER,
        parentId: this.parentId,
      });
    }
    await mkdir(FOLDER_PATH, { recursive: true });
    const localPath = join(FOLDER_PATH, v4());
    await writeFile(localPath, Buffer.from(this.data, 'base64'));
    return this.filesCollection.addFile({
      userId: ObjectId(this.userId),
      name: this.name,
      type: this.type,
      isPublic: this.isPublic,
      parentId: this.parendId ? ObjectId(this.parentId) : 0,
      localPath,
    });
  }
}
