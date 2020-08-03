module.exports = class Namahamu {
  constructor(obj) {
    this.namahamu = obj;
    return this.namahamu;
  }

  get namahamu() {
    return this.instance;
  }

  set namahamu(obj) {
    this.instance = {
      bookTitle: obj.bookTitle || null,
      circleName: obj.circleName || null,
      artistNames: obj.artistNames || [],
      genres: obj.genres || [],
      publishDate: obj.publishDate || '1970/01/01',
      bookSize: obj.bookSize || null,
      pageNumber: obj.pageNumber || 0,
    };
  }
};
