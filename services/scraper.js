const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeArticles() {
  const res = await axios.get('https://gkom.org/');
  const $ = cheerio.load(res.data);
  const articles = [];
  $('.product').each((_, el) => {
    articles.push({
      name: $(el).find('.product-title').text(),
      price: parseFloat($(el).find('.price').text().replace(/[^\d\.]/g, '')),
      description: $(el).find('.description').text(),
      stock: 10
    });
  });
  return articles;
};