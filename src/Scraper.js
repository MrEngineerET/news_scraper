const fs = require('fs')
const path = require('path')
const debugBotDatabase = require('debug')('debugBotDatabase')
const debugScraper = require('debug')('debugScraper')
const axios = require('axios')

const { loader } = require('./loader')
const { parser } = require('./parser')

class Scraper {
	/**
	 * run the scraper for all the configration file found in the configFileDirectory
	 */
	static async runScraper(configsFileDirectory, fileSavingDir = null) {
		// reading the base configration file which contain path and to the news configration file
		debugScraper('Started Reading config.json file')
		let configs = fs
			.readdirSync(configsFileDirectory)
			.filter(fileName => fileName.indexOf('.') != 0 && fileName.slice(-5) === '.json')
			.map(fileName => {
				return this._readJSONfile(path.join(configsFileDirectory, fileName))
			})
		debugScraper('Finished Reading config.json file')

		// TODO---- start ---- until telegram page scraper is implemented
		configs = configs.filter(config => config.source.type != 'telegram')
		// ---- end ----

		// for (let config of configs) {
		configs.forEach(async config => {
			try {
				let allNews = []
				let { links: urls } = await this.scrape(config.showCaseConfig, null, config.source)
				for (let url of urls) {
					try {
						let news = await this.scrape(config.newsConfig, url, config.source)
						if (!fileSavingDir) this._saveNewstoDatabase({ url, ...news })
						else allNews.push({ url, ...news })
					} catch (error) {
						console.log(error)
					}
				}
				if (fileSavingDir) {
					const fileName = `${config.source.name.replace(/\W/g, '_')}.json`
					const savingLocation = path.join(fileSavingDir, `${fileName}`)
					this._saveNEWStoFile(allNews, savingLocation)
				}
			} catch (error) {
				console.log(error)
			}
		})
	}
	/**
	 * scrape a single configration file and save either in a database or in a file
	 */
	static async runSingleScraper(configFile, fileSavingDir = null) {
		debugScraper('Started Reading the configration file file')
		let config = this._readJSONfile(configFile)
		debugScraper('Finished Reading config.json file')
		try {
			let allNews = []
			let { links: urls } = await this.scrape(config.showCaseConfig, null, config.source)
			for (let url of urls) {
				try {
					let news = await this.scrape(config.newsConfig, url, config.source)
					if (!fileSavingDir) this._saveNewstoDatabase({ url, ...news })
					else allNews.push({ url, ...news })
				} catch (error) {
					console.log(error)
				}
			}
			if (fileSavingDir) {
				const fileName = `${config.source.name.replace(/\W/g, '_')}.json`
				const savingLocation = path.join(fileSavingDir, `${fileName}`)
				this._saveNEWStoFile(allNews, savingLocation)
			}
		} catch (error) {
			console.log(error)
		}
	}
	// save the news to a file
	static async _saveNEWStoFile(news, location) {
		debugScraper('	Writting to a file Started')
		try {
			fs.writeFile(location, JSON.stringify(news), 'utf-8', () => {
				debugScraper('	Finished writting to a file')
			})
		} catch (error) {
			debugScraper('	Failed to write a file ' + error.message)
		}
	}
	// saves the news to the database
	static async _saveNewstoDatabase(news) {
		debugBotDatabase('		Started saving news to the database')
		try {
			let doc = await axios.post(`${process.env.URL}/news`, news)
			if (doc) debugBotDatabase('		News Saved to database succesfully')
			return doc
		} catch (error) {
			debugBotDatabase(`		Failed saving News: ${error}`)
		}
	}
	// the main scraping function; returns the raw scraped data
	static async scrape(config, url = null, source) {
		debugScraper(`Started scraping news from ${source.name}`)
		try {
			let page
			if (url) page = await loader(url)
			else page = await loader(config.url)
			const result = parser(page, config.selectorObjs)
			debugScraper(`News Successfully scraped from ${source.name}`)
			return { source: source.id, ...result }
		} catch (error) {
			debugScraper(`Failed to scraped from ${source.name}`)
		}
	}
	//read a json file and return the parsed json object
	static _readJSONfile(location) {
		let file = fs.readFileSync(location, {
			encoding: 'utf-8',
		})
		file = JSON.parse(file)
		return file
	}
}

module.exports = Scraper
