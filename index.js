const fs = require('fs')
const path = require('path')
const debugScraper = require('debug')('debugScraper')

const { createNews } = require('./Service/newsServices')
const { loader } = require('./src/loader')
const { parser } = require('./src/parser')

// scrape one news site
async function scrape(config) {
	try {
		debugScraper(`Started Scrapping ${config.name} site`)
		// getting all the news-link from the showcase
		const urls = await scrapeShowCase(config)

		// fetching all the news from each link in the links
		for (let url of urls) {
			let news = await scrapeNEWS(url, config)
			saveNEWS({ url, ...news })
		}
		debugScraper(`Finished Scrapping ${config.name} site`)
	} catch (err) {
		debugScraper(`Failed Scrapping ${config.name}: ${err.message}`)
	}
}
// gets all the news-link from the showcase
async function scrapeShowCase({ showCase }) {
	try {
		let showCasePage = await loader(showCase.url)
		const { links } = parser(showCasePage, showCase.selectorObjs)
		return links
	} catch (error) {}
}
// fetching all the neccessary component of the news from the link
async function scrapeNEWS(link, config) {
	try {
		const page = await loader(link)
		const news = parser(page, config.news.selectorObjs)
		return news
	} catch (error) {}
}
// save the news to a file
async function saveNEWS(news) {
	debugScraper('	Writting to a file Started')
	try {
		await createNews(news)
		debugScraper('	Finished writting to a file')
	} catch (error) {
		debugScraper('	Failed to write a file ' + error.message)
	}
}

//read a json file and return the parsed json object
function readJSONfile(location) {
	let file = fs.readFileSync(location, {
		encoding: 'utf-8',
	})
	file = JSON.parse(file)
	return file
}

async function runScraper() {
	// reading the base configration file which contain path and to the news configration file
	debugScraper('Started Reading config.json file')
	let configs = readJSONfile(path.join(__dirname, 'configs', 'configs.json'))
	debugScraper('Finished Reading config.json file')

	// TODO---- start ---- until telegram page scraper is implemented
	configs = configs.filter(config => !config.type)
	// ---- end ----

	const newsPromise = configs.map(({ name, location }) => {
		let config = readJSONfile(location)
		return scrape(config)
	})

	Promise.all(newsPromise)
}

module.exports = {
	runScraper,
	test,
}
