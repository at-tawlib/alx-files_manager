import File, { FilesCollection } from '../utils/file';
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

  // retrieves file document based on the ID
  static async getShow(req, res) {
    // get user
    const user = await getCurrentUser(req);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const filesColection = new FilesCollection();
    const file = await filesColection.findUserFileById(user.id, id);
    if (!file) return res.status(401).json({ error: 'Not found' });

    return res.status(200).json(file);
  }

  // retrieve all users file documents for a specific parentId and with pagination
  static async getIndex(req, res) {
    // get current user
    const user = await getCurrentUser(req);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let { parentId, page } = req.query;
    if (parentId === '0' || !parentId) parentId = 0;
    page = Number.isNaN(page) ? 0 : Number(page);

    const filesCollection = new FilesCollection();
    const files = await filesCollection.findAllUserFilesByParentId(
      user.id,
      parentId,
      page,
    );

    return res.status(200).json(files);
  }

  // set isPublic to true
  static async putPublish(req, res) {
    return FilesController.updatePublication(req, res, true);
  }

  // set isPublic to false
  static async putUnpublish(req, res) {
    return FilesController.updatePublication(req, res, false);
  }

  static async updatePublication(req, res, isPublished) {
    // get user
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const filesCollection = new FilesCollection();
    const file = await filesCollection.updateFilePublication(
      user.id, id, isPublished,
    );
    if (!file) return res.status(404).json({ error: 'Not foudn' });
    return res.status(200).json(file);
  }
}

export default FilesController;
