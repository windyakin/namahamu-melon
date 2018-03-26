const express = require('express');
const morgan = require('morgan');

const app = express();

const Melon = require('./modules/melon.js');

app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.send('Namahamu Melon');
});

app.get('/melon/:id', async (req, res) => {
  const melon = await new Melon();
  try {
    const book = await melon.getNamahamu(req.params.id);
    res.json(book);
  } catch (e) {
    throw e;
  } finally {
    await melon.close();
  }
});

app.listen(3000);
