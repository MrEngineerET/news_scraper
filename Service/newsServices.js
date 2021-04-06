const db = require('../../models/database')
const debugBotDatabase = require('debug')('debugBotDatabase')
const models = db.default.sequelize.models

exports.createNews = async data => {
	try {
		const News = models.News
		let doc = await News.create(data)
		if (doc) debugBotDatabase('News Saved to database succesfully')
		return JSON.parse(JSON.stringify(doc))
	} catch (error) {
		debugBotDatabase(`Failed saving News: ${error}`)
	}
}
