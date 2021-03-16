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

async function getNEWS() {
	// load the the showcase page
	let showCasePage = await loader(ethiopianMonitorConfig.baseURL)
	const { links } = parser(showCasePage, ethiopianMonitorConfig.newsLinkSelectorObjs)

	let newsPages = []
	let requirednewsContent = []
	for (let link of links) {
		const page = await loader(link)
		newsPages.push({ page, link })
	}
	requirednewsContent = newsPages.map(({ page, link }) => {
		return { link, ...parser(page, ethiopianMonitorConfig.selectorObjs) }
	})
	return requirednewsContent
}

getNEWS().then(news => {
	console.log('Writting to a file Started')
	fs.writeFileSync(path.join(ethiopianMonitorConfig.writingLocation), JSON.stringify(news))
	console.log('Writing to file is done')
})
