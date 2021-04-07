const fs = require('fs')
const path = require('path')
const debugBotDatabase = require('debug')('debugBotDatabase')
const debugScraper = require('debug')('debugScraper')

const { loader } = require('./loader')
const { parser } = require('./parser')

class Scraper {
	constructor(configsFileDirectory = null, Model = null, fileSavingDir = null) {
		this.configsFileDirectory = configsFileDirectory
		this.Model = Model
		this.fileSavingDir = fileSavingDir
		if (configsFileDirectory)
			if (!(Model || fileSavingDir) || (Model && fileSavingDir))
				throw Error('Only either Model or fileSavingLocation must be defined')
	}
	/**
	 * used when configFileDirectory and either Model or fileSavingDir are provided by the constructur
	 * run for all the configration file found in the configFileDirectory
	 */
	async runScraper() {
		// reading the base configration file which contain path and to the news configration file
		debugScraper('Started Reading config.json file')
		let configs = fs
			.readdirSync(this.configsFileDirectory)
			.filter(fileName => fileName.indexOf('.') != 0 && fileName.slice(-5) === '.json')
			.map(fileName => {
				return this._readJSONfile(path.join(this.configsFileDirectory, fileName))
			})
		debugScraper('Finished Reading config.json file')

		// TODO---- start ---- until telegram page scraper is implemented
		configs = configs.filter(config => config.type != 'telegram')
		// ---- end ----

		// for (let config of configs) {
		configs.forEach(async config => {
			try {
				let allNews = []
				let { links: urls } = await this.scrape(config.showCaseConfig, null, config.name)
				for (let url of urls) {
					try {
						let news = await this.scrape(config.newsConfig, url, config.name)
						if (this.Model) this.saveNewstoDatabase({ url, ...news })
						else allNews.push({ url, ...news })
					} catch (error) {
						console.log(error)
					}
				}
				if (!this.Model) {
					const fileName = `${config.name.replace(/\W/g, '_')}.json`
					const savingLocation = path.join(this.fileSavingDir, `${fileName}`)
					this.saveNEWStoFile(allNews, savingLocation)
				}
			} catch (error) {
				console.log(error)
			}
		})
	}
	/**
	 * scrape a single configration file and save either in a database or in a file
	 */
	async runSingleScraper(configFile, Model = null, fileSavingDir = null) {
		if (!(Model || fileSavingDir) || (Model && fileSavingDir))
			throw Error('Only either Model or fileSavingLocation must be defined')

		debugScraper('Started Reading the configration file file')
		let config = this._readJSONfile(configFile)
		debugScraper('Finished Reading config.json file')
		try {
			let allNews = []
			let { links: urls } = await this.scrape(config.showCaseConfig, null, config.name)
			for (let url of urls) {
				try {
					let news = await this.scrape(config.newsConfig, url, config.name)
					if (Model) this.saveNewstoDatabase({ url, ...news }, Model)
					else allNews.push({ url, ...news })
				} catch (error) {
					console.log(error)
				}
			}
			if (!Model) {
				const fileName = `${config.name.replace(/\W/g, '_')}.json`
				const savingLocation = path.join(fileSavingDir, `${fileName}`)
				this.saveNEWStoFile(allNews, savingLocation)
			}
		} catch (error) {
			console.log(error)
		}
	}
	// save the news to a file
	async saveNEWStoFile(news, location) {
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
	async saveNewstoDatabase(news, Model = this.Model) {
		debugBotDatabase('		Started saving news to the database')
		try {
			let doc = await Model.create(news)
			if (doc) debugBotDatabase('		News Saved to database succesfully')
			return JSON.parse(JSON.stringify(doc))
		} catch (error) {
			debugBotDatabase(`		Failed saving News: ${error}`)
		}
	}
	// the main scraping function
	async scrape(config, url = null, source) {
		debugScraper(`Started scraping news from ${source}`)
		try {
			let page
			if (url) page = await loader(url)
			else page = await loader(config.url)
			const result = parser(page, config.selectorObjs)
			debugScraper(`News Successfully scraped from ${source}`)
			return result
		} catch (error) {
			debugScraper(`Failed to scraped from ${source}`)
		}
	}
	//read a json file and return the parsed json object
	_readJSONfile(location) {
		let file = fs.readFileSync(location, {
			encoding: 'utf-8',
		})
		file = JSON.parse(file)
		return file
	}
}

module.exports = Scraper
