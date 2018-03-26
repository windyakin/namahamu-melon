const express = require('express');
const morgan = require('morgan');
const Melon = require('./modules/melon.js');

const app = express();
let melon = null;

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
  app.listen(3000);
})();
