import express from 'express';
import { env } from 'process';

const router = require('./routes/index');

const app = express();
const PORT = env.PORT || 5000;
app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

export default app;
