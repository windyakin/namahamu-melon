const express = require('express');

const app = express();

const Melon = require('./modules/melon.js');
const Namahamu = require('./modules/namahamu.js');

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
