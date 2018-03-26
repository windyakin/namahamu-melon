const express = require('express');
const morgan = require('morgan');
const Melon = require('./modules/melon.js');

const app = express();
let melon = null;
let server = null;

app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.send('Namahamu Melon');
});

app.get('/melon/:id', async (req, res) => {
  try {
    const book = await melon.getNamahamu(req.params.id);
    res.json(book);
  } catch (e) {
    throw e;
  } finally {
    await melon.close();
  }
});

(async () => {
  melon = await new Melon();
  server = app.listen(3000);
})();

// NOTE: Graceful exit
process.on('SIGINT', async () => {
  await server.close(async () => {
    await melon.close();
    process.exit();
  });
});
