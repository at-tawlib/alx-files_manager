import sha1 from 'sha1';
import { v4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    // get and check token type from authHeader
    const tokenType = authHeader.substring(0, 6);
    if (tokenType !== 'Basic ') {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }
    const token = authHeader.substring(6);

    // decode the token
    const decodedToken = Buffer.from(token, 'base64').toString('utf8');
    if (!decodedToken.includes(':')) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    // get email and password from the decoded token
    const [email, password] = decodedToken.split(':');
    const user = await dbClient.getUser(email);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    if (user.password !== sha1(password)) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    const accessToken = v4();
    await redisClient.set(`auth_${accessToken}`, user._id.toString('utf8'), 60 * 60 * 24);
    res.status(200).json({ token: accessToken });
    res.end();
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    const id = await redisClient.get(`auth_${token}`);
    if (!id) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }
    const user = await dbClient.getUserById(id);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return;
    }

    await redisClient.del(`auth_${token}`);
    res.status(204).end();
  }
}

export default AuthController;
