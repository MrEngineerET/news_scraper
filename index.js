// const fs = require('fs')
const path = require('path')
const fs = require('fs')

const { loader } = require('./src/loader')
const { parser } = require('./src/parser')

let ethiopianMonitorConfig = fs.readFileSync(
	path.join(__dirname, 'configs', 'ethiopianMonitorConfig.json'),
	{ encoding: 'utf-8' }
)
ethiopianMonitorConfig = JSON.parse(ethiopianMonitorConfig)

scrape(ethiopianMonitorConfig)

async function scrape(config) {
	// getting all the news-link from the showcase
	const links = await scrapeShowCase(config)

	// fetching all the news from each link in the links
	let allNEWS = []
	for (let link of links) {
		let news = await scrapeNEWS(link, config)
		allNEWS.push({ link, ...news })
	}

	//saving all the news
	saveNEWS(allNEWS, config.news.savingLocation)
}

async function scrapeShowCase({ showCase }) {
	let showCasePage = await loader(showCase.url)
	const { links } = parser(showCasePage, showCase.selectorObjs)
	return links
}
async function scrapeNEWS(link, config) {
	const page = await loader(link)
	const news = parser(page, config.news.selectorObjs)
	return news
}
function saveNEWS(news, location) {
	console.log('Writting to a file Started')
	fs.writeFileSync(path.join(location), JSON.stringify(news))
	console.log('Writing to file is done')
}
