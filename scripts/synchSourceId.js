// this script is used to synch the source id found in the database and the source id found in the
// configration files of the site scraping configration.

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const debugSychSourceId = require('debug')('debugSychSourceId')

async function run() {
	try {
		// getting all the sources documents from the database
		let sources = (await axios.get(`${process.env.URL}/source`)).data.data

		const configsFileDirectory = path.join(__dirname, '..', 'configs')
		// reading all the configration file found in the configsFileDirectory
		debugSychSourceId('Started Reading config.json file')
		fs.readdirSync(configsFileDirectory)
			.filter(fileName => fileName.indexOf('.') != 0 && fileName.slice(-5) === '.json')
			.map(fileName => {
				const config = readJSONfile(path.join(configsFileDirectory, fileName))
				for (let source of sources) {
					if (config.source.name == source.name) {
						config.source.id = source._id
						break
					}
					config.source.id = null
				}
				writeJSONfile(path.join(configsFileDirectory, fileName), config)
			})
		debugSychSourceId('Finished Reading config.json file')
		// synch the ids

		// write to the file
	} catch (error) {
		console.log(error.message)
	}
}

function readJSONfile(location) {
	let file = fs.readFileSync(location, {
		encoding: 'utf-8',
	})
	file = JSON.parse(file)
	return file
}
function writeJSONfile(location, data) {
	fs.writeFileSync(location, JSON.stringify(data))
}

module.exports = { synchSourceId: run }
