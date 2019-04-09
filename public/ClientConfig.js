var igeClientConfig = {
	include: [
		/* Include jQuery */
		
		/* Your custom game JS scripts */
		'./gameClasses/ClientItem.js',
		'./gameClasses/ClientObjects.js',
        './gameClasses/Character.js',
		'./gameClasses/CharacterContainer.js',
		'./gameClasses/PlayerComponent.js',

		/* Standard game scripts */
		'./client.js',
		'./index.js',

        /* Scripts du jeu */
        './gameClasses/farming/game.js',
        './gameClasses/farming/socketCommunication.js',
        './gameClasses/farming/harvesting.js',
        './gameClasses/farming/building.js',

        /* Outils */
        './js/outils.js',
	]
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = igeClientConfig; }