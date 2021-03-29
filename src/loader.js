const axios = require('axios')

/**
 *
 * @param {string} url
 * @returns {string} html file
 */
exports.loader = async url => {
	let root = await axios.get(encodeURI(url))
	return root.data
}
