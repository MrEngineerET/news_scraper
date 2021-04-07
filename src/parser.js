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
		result[selectorObj.name] = getContent(dom, selectorObj)
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
function getContent(dom, selectorObj) {
	const { type = 'string' } = selectorObj
	switch (type) {
		case 'string': // if the selector is supposed to scrape a single element
			return getContentString(dom, selectorObj)
		case 'array': // if the selector is supposed to scrape an array of element
			return getContentArray(dom, selectorObj)
		case 'date': // if the selector is supposed to scrape a date element
			return getContentDate(dom, selectorObj)
	}
	return null
}

function getContentString(dom, selectorObj) {
	let content = dom.querySelector(selectorObj.selector)
	if (!content) return returnDefaultOrNull(selectorObj)
	if (selectorObj.attribute) {
		content = content.getAttribute(selectorObj.attribute)
		if (content) {
			// if the attribute is an href and the link is not valid
			if (selectorObj.attribute == 'href' && !validLink(content)) {
				content = selectorObj.webDomain + content
			}
			return content.trim()
		}
		return returnDefaultOrNull(selectorObj)
	}
	content = content.text
	if (content) return content.trim()
	else return returnDefaultOrNull(selectorObj)
}

function getContentArray(dom, selectorObj) {
	let content = dom.querySelectorAll(selectorObj.selector)
	if (!content) return returnDefaultOrNull(selectorObj)
	if (selectorObj.attribute) {
		content = content.map(el => el.getAttribute(selectorObj.attribute))
		// if the attribute is an href and the link is not valid
		content = content.map(el => {
			if (el) {
				if (selectorObj.attribute == 'href' && !validLink(el)) {
					el = selectorObj.webDomain + el
				}
				return el.trim()
			}
			return returnDefaultOrNull(selectorObj)
		})
	} else content = content.map(el => el.text)
	// return result
	if (selectorObj.outputType == 'array') return content
	else return content.join(selectorObj.delimiter)
}

function getContentDate(dom, selectorObj) {
	let date = dom.querySelector(selectorObj.selector)
	if (!date) return returnDefaultOrNull(selectorObj)

	if (selectorObj.attribute) {
		date = date.getAttribute(selectorObj.attribute)
		if (date) return new Date(date.trim())
	}
	date = date.text
	if (date) return new Date(date.trim())
	else return returnDefaultOrNull(selectorObj)
}

function validLink(link) {
	return link.includes('https')
}

function returnDefaultOrNull(selectorObj) {
	if (selectorObj.default) return selectorObj.default
	return null
}
