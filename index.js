const fs = require('fs')
const spinner = require('ora')

const { loader } = require('./src/loader')
const { parser } = require('./src/parser')

// reading the base configration file which contain path and to the news configration file
spinner('Started Reading config.json file').start()
let configs = readJSONfile('configs/configs.json')
spinner('Finished Reading config.json file').succeed()

// TODO---- start ---- until telegram page scraper is implemented
configs = configs.filter(config => !config.type)
// ---- end ----
;(async () => {
	// read the configration of each news and scrape
	for (let { name, location } of configs) {
		let config = readJSONfile(location)
		spinner(`Started Scrapping ${name} site`).start()
		await scrape(config)
		spinner(`Finished Scrapping ${name} site`).succeed()
	}
})()

async function scrape(config) {
	try {
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
	} catch (err) {
		console.log(`Error: ${err.message}`)
	}
}
// gets all the news-link from the showcase
async function scrapeShowCase({ showCase }) {
	let showCasePage = await loader(showCase.url)
	const { links } = parser(showCasePage, showCase.selectorObjs)
	return links
}
// fetching all the neccessary component of the news from the link
async function scrapeNEWS(link, config) {
	const page = await loader(link)
	const news = parser(page, config.news.selectorObjs)
	return news
}
// save the news to a file
function saveNEWS(news, location) {
	spinner('	Writting to a file Started').start()
	fs.writeFileSync(location, JSON.stringify(news))
	spinner('	Finished writting to a file').succeed()
}

function readJSONfile(location) {
	let file = fs.readFileSync(location, {
		encoding: 'utf-8',
	})
	file = JSON.parse(file)
	return file
}
