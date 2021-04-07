// example on how to use the scraper class; scraped content will be saved in json file
const path = require('path')
const Scraper = require('./src/Scraper')

const configDirectory = path.join(__dirname, 'configs')
const fileSavingDirectory = path.join(__dirname, 'data')
let scraper = new Scraper(configDirectory, null, fileSavingDirectory)
scraper.runScraper()
