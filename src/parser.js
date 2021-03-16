const HTMLParser = require('node-html-parser')

/**
 * change the html string to html dom and parse for contents specified in the config parameter
 * @param {string} html
 * @param {Array} selectorObjs  an array of object containing CSS selectors,
 *                        type of content to be parsed, and type of element to be parserd
 * @return {Object}
 *
 */
exports.parser = (html, selectorObjs) => {
	if (!html) return null
	const dom = HTMLParser.parse(html)
	result = {}
	for (selectorObj of selectorObjs) {
		result[selectorObj.name] = _getContent(dom, selectorObj)
	}
	return result
}

/**
 * parse for a content of a single CSS selector
 * @param {XMLDocument} html
 * @param {Object} selectorObj
 * @param {string} selectorObj.selector
 * @param {string} selectorObj.type
 * @return {string | null}
 *
 */
function _getContent(dom, selectorObj) {
	const { type = 'string' } = selectorObj
	switch (type) {
		case 'string': // if the selector is supposed to scrape a single element
			return _getContentString(dom, selectorObj)
		case 'array': // if the selector is supposed to scrape an arry of element
			return _getContentArray(dom, selectorObj)
		case 'date': // if the selector is supposed to scrape a date element
			return _getContentDate(dom, selectorObj)
	}
	return null
}

function _getContentString(dom, selectorObj) {
	let content = dom.querySelector(selectorObj.selector)
	if (!content) return null

	if (selectorObj.attribute) {
		content = content.getAttribute(selectorObj.attribute)
		if (content) return content.trim()
	}
	content = content.text
	if (content) return content.trim()
	else return null
}

function _getContentArray(dom, selectorObj) {
	let content = dom.querySelectorAll(selectorObj.selector)
	if (!content) return null
	else {
		if (selectorObj.attribute) content = content.map(el => el.getAttribute(selectorObj.attribute))
		else content = content.map(el => el.text)
		// return result
		if (selectorObj.outputType == 'array') return content
		else return content.join(selectorObj.delimiter)
	}
}

function _getContentDate(dom, selectorObj) {
	let date = dom.querySelector(selectorObj.selector)
	if (!date) return null

	if (selectorObj.attribute) {
		date = date.getAttribute(selectorObj.attribute)
		if (date) return new Date(date.trim())
	}
	date = date.text
	if (date) return new Date(date.trim())
	else return null
}
