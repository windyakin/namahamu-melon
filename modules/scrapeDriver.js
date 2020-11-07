const Puppeteer = require('puppeteer');

module.exports = class ScrapeDriver {
  constructor() {
    return new Promise((resolve, reject) => {
      const options = {};
      if (process.env.CHROME_EXECUTE_PATH) {
        options.executablePath = process.env.CHROME_EXECUTE_PATH;
      }
      Puppeteer.launch(options)
        .then((instance) => {
          this.driver = instance;
          resolve(this);
        }).catch((e) => {
          reject(e);
        });
    });
  }

  get driver() {
    if (this.puppeteerInstance) {
      return this.puppeteerInstance;
    }
    return undefined;
  }

  set driver(instance) {
    this.puppeteerInstance = instance;
  }
};
