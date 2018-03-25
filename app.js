const express = require('express');
const morgan = require('morgan');

const app = express();

const Melon = require('./modules/melon.js');
const Namahamu = require('./modules/namahamu.js');

app.use(morgan('combined'));

app.get('/melon/:id', async (req, res) => {
  const bookId = req.params.id;
  const melon = await new Melon();
  try {
    const values = await melon.getBookAttributes(bookId);
    const book = new Namahamu(values);
    res.json(book);
  } catch (e) {
    console.error(e);
  } finally {
    await melon.close();
  }
});

app.listen(3000);
