const Promise = require('bluebird');
const Puppeteer = require('puppeteer');

const Namahamu = require('./namahamu.js');

module.exports = class Melon {
  constructor() {
    return new Promise((resolve, reject) => {
      const options = {};
      if (process.env.CHROME_EXECUTE_PATH) {
        options.executablePath = process.env.CHROME_EXECUTE_PATH;
      }
      Puppeteer.launch(options)
        .then((browser) => {
          this.browser = browser;
          resolve(this);
        }).catch((e) => {
          reject(e);
        });
    });
  }

  async getNamahamu(namahamuId) {
    return new Namahamu(await this.scrapeNamahamuData(namahamuId));
  }

  async scrapeNamahamuData(namahamuId) {
    const page = await this.browser.newPage();
    try {
      const [response] = await Promise.all([
        page.goto(`${Melon.baseUrl()}${namahamuId}`),
        page.waitForNavigation(),
      ]);

      if (response.status() === 404) {
        throw new Error('NotFound');
      }

      if (await Melon.isUnderagePage(page)) {
        await Melon.throughUnderage(page);
      }

      const rows = await Melon.getAttributesContent(page);

      const values = await Promise.all(rows.map(async (row) => {
        const object = await Melon.convertKeyValuePair(row);
        return object;
      }));
      return values;
    } catch (e) {
      throw e;
    } finally {
      await page.close();
    }
  }

  static async convertKeyValuePair(row) {
    const key = (await (await (await row.$('th')).getProperty('innerText')).jsonValue()).trim();
    let value = (await (await (await row.$('td')).getProperty('innerText')).jsonValue()).trim();
    if (key === 'サークル名' || key === '作家名') {
      value = value.replace(/^(.+)\nお気に入り(サークル|作家)に登録する$/, '$1');
    }
    return { key, value };
  }

  static async getAttributesContent(page) {
    try {
      const description = await page.$('#description');
      const table = await description.$('table');
      const rows = await table.$$('tr');
      return rows;
    } catch (e) {
      throw e;
    }
  }

  static async isUnderagePage(page) {
    const popup = await page.$('.popup');
    return popup !== null;
  }

  static async throughUnderage(page) {
    await Promise.all([
      page.waitForNavigation(),
      page.click('.f_left.yes'),
    ]);
  }

  static baseUrl() {
    // NOTE: Anti Google bots :)
    return Buffer.from('aHR0cHM6Ly93d3cubWVsb25ib29rcy5jby5qcC9kZXRhaWwvZGV0YWlsLnBocD9wcm9kdWN0X2lkPQ==', 'base64').toString();
  }

  async close() {
    await this.browser.close();
  }
};
