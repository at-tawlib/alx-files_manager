import File from '../utils/file';
import fileQueue from '../worker';
import { getCurrentUser } from '../utils/auth';

class FilesController {
  static async postUpload(req, res) {
    // get user from token
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    console.log(name, type, parentId, isPublic, data);

    try {
      const file = new File(
        user._id, name, type, parentId, isPublic, data,
      );

      const savedFile = await file.save();
      if (savedFile.type === 'image') {
        fileQueue.add({
          userId: user.id,
          fileId: savedFile.id,
        });
      }
      return res.status(201).json(savedFile);
    } catch (err) {
      return res.status(400).json({ error: err.mesage });
    }
  }
}

export default FilesController;
