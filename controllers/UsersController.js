import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      res.end();
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      res.end();
      return;
    }

    if (await dbClient.userExist(email)) {
      res.status(400).json({ error: 'Already exist' });
      res.end();
      return;
    }

    const user = await dbClient.createUser(email, password);
    const id = user.insertedId;
    res.status(201).json({ id, email });
    res.end();
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    const userId = await redisClient.get(`auth_${token}`);

    const user = await dbClient.getUserById(userId);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    const usr = { id: user._id, ...user};
    delete usr._id;
    delete usr.password;
    res.status(200).json(usr);
  }
}

export default UsersController;
