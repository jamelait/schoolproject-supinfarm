var igeCoreConfig = {
	include: [
		/* Engine Actual */
		['csap', 'IgeEngine', 'core/ige.js']
	]
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = igeCoreConfig; }