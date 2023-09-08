import dbClient from "../utils/db";
import redisClient from "../utils/redis";
import File, { FOLDER, FilesCollection } from "../utils/file";
import fileQueue from '../worker';

class FilesController {
  static async postUpload(req, res) {

    // get user from token
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await dbClient.getUserById(userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    console.log(name, type, parentId, isPublic, data);

    try {
      const file = new File(
        user._id, name, type, parentId, isPublic, data,
      );
      console.log("File", file)

      const savedFile = await file.save();
      console.log("saved file", savedFile);
      if (savedFile.type === 'image') {
        fileQueue.add({
          userId: user.id,
          fileId: savedFile.id,
        });
      }
      return res.status(201).json(savedFile);
    } catch(err) {
      console.log("catch error", err);
      return res.status(400).json({ error: err.mesage});
    }
  }
}

export default FilesController;