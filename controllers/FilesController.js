import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const {
      name, type, parentId, isPublic = false, data,
    } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // retrieve user fromt the token
    const userId = await redisClient.get(`auth_${token}`);
    const user = await dbClient.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || (type !== 'folder' && type !== 'file' && type !== 'image')) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    try {
      if (parentId) {
        // get folder
        const folder = await dbClient.filterFiles({ _id: parentId });
        if (!folder) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (folder.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const newFile = await dbClient.saveFile(userId, name, type, isPublic, parentId, data);
      return res.status(201).send(newFile);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default FilesController;
