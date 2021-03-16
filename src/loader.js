const axios = require('axios')

exports.loader = async url => {
	let root = await axios.get(url)
	return root.data
}
