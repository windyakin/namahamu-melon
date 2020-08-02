const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');

const ScrapeDriver = require('./modules/scrapeDriver.js');
const Melon = require('./modules/melon.js');

const app = express();
let scrapeDriver = null;
let melon = null;
let server = null;

app.use(helmet());
app.use(morgan('combined'));
app.disable('x-powered-by');

app.get('/', (req, res) => {
  res.send('Namahamu Melon');
});

app.get('/melon/:id', async (req, res) => {
  try {
    const book = await melon.getNamahamu(req.params.id);
    res.json(book);
  } catch (e) {
    switch (e.message) {
      case 'NotFound':
        res.status(404).json({ statusCode: 404 });
        break;
      default:
        console.error(e);
        res.status(500).json({ statusCode: 500 });
        break;
    }
  }
});

(async () => {
  scrapeDriver = await new ScrapeDriver();
  melon = new Melon(scrapeDriver);
  server = app.listen(3000);
})();

// NOTE: Graceful exit
['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, async () => {
  await server.close(async () => {
    try {
      await scrapeDriver.close();
    } finally {
      process.exit();
    }
  });
}));
