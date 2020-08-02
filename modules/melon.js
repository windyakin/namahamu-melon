const Promise = require('bluebird');

const Namahamu = require('./namahamu.js');

module.exports = class Melon {
  constructor(scrapeDriver) {
    this.driver = scrapeDriver.driver;
  }

  async getNamahamu(namahamuId) {
    return new Namahamu(await this.scrapeNamahamuData(namahamuId));
  }

  async scrapeNamahamuData(namahamuId) {
    const page = await this.getPage(namahamuId);
    try {
      const rows = await this.constructor.getAttributesContent(page);

      const values = Object.fromEntries(
        await Promise.all(rows.map(async (row) => {
          const object = await this.constructor.convertKeyValuePair(row);
          return object;
        })).filter((v) => v),
      );
      return values;
    } finally {
      await page.close();
    }
  }

  async getPage(namahamuId) {
    const page = await this.driver.newPage();
    const [response] = await Promise.all([
      page.goto(`${this.constructor.baseUrl()}${namahamuId}`),
      page.waitForNavigation(),
    ]);

    if (response.status() === 404) {
      throw new Error('NotFound');
    }

    if (await this.constructor.isUnderagePage(page)) {
      await this.constructor.throughUnderage(page);
    }
    return page;
  }

  static async convertKeyValuePair(row) {
    const key = (await (await (await row.$('th')).getProperty('innerText')).jsonValue()).trim();
    switch (key) {
      case 'タイトル':
        return [
          'bookTitle',
          (await (await (await row.$('td')).getProperty('innerText')).jsonValue()).trim(),
        ];
      case 'サークル名':
        return [
          'circleName',
          (await (await (await row.$('td > a')).getProperty('innerText')).jsonValue()).replace(/^(.+)\u00a0\(作品数:\d+\)/, '$1').trim(),
        ];
      case '作家名': {
        const artistNames = await Promise.all((await row.$$('td > a')).map(async (link) => {
          const name = (await (await link.getProperty('innerText')).jsonValue()).trim();
          if (name === '他') return null;
          return name;
        })).filter((v) => v);
        return ['artistNames', artistNames];
      }
      case 'ジャンル': {
        const genres = await Promise.all((await row.$$('td > a')).map(async (link) => {
          return (await (await link.getProperty('innerText')).jsonValue()).trim();
        })).filter((v) => v);
        return ['genres', genres];
      }
      case '発行日':
        return [
          'publishDate',
          (await (await (await row.$('td')).getProperty('innerText')).jsonValue()).trim(),
        ];
      case '版型・メディア':
        return [
          'bookSize',
          (await (await (await row.$('td')).getProperty('innerText')).jsonValue()).trim(),
        ];
      case '総ページ数・CG数・曲数':
        return [
          'pageNumber',
          parseInt((await (await (await row.$('td')).getProperty('innerText')).jsonValue()).trim(), 10),
        ];
      default:
        return null;
    }
  }

  static async getAttributesContent(page) {
    const description = await page.$('#description');
    const table = await description.$('table');
    const rows = await table.$$('tr');
    return rows;
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
    await this.driver.close();
  }
};
