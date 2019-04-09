players = new Object();
meCreated = false;
pendingPlayers = new Object();
characterType = 1;
id_farmer = "";
canWalk = true;
tabTile = new Array();

var Client = IgeClass.extend({
    classId: 'Client',

    init: function () {
        //ige.showStats(1);

        // Enabled texture smoothing when scaling textures
        ige.globalSmoothing(true);

        // Load our textures
        var self = this;

        //this.obj = [];
        this.gameTexture = {};

        // Implement our game object definitions (see ClientObjects.js)
        this.implement(ClientObjects);

        // Wait for our textures to load before continuing
        ige.on('texturesLoaded', function () {
            // Create the HTML canvas
            ige.createFrontBuffer(true);

            ige.start(function (success) {
                // Check if the engine started successfully
                if (success) {
                    ige.viewportDepth(true);

                    // Create the basic scene, viewport etc
                    self.setupScene();

                    // Create the UI entities
                    self.setupUi();

                    // Setup the initial entities
                    self.setupEntities();

                    uiReady();

                    self.setFarmer('me');
                }
            });
        });

        this.loadTextures();
    },

    loadTextures: function () {
        this.gameTexture.background0 = new IgeTexture('../assets/textures/backgrounds/grassTile.png');
        this.gameTexture.background1 = new IgeTexture('../assets/textures/backgrounds/groundTile.png');
        this.gameTexture.silo = new IgeTexture('../assets/textures/buildings/silo.png');
        this.gameTexture.barn = new IgeTexture('../assets/textures/buildings/barn.png');
        this.gameTexture.coldstorage = new IgeTexture('../assets/textures/buildings/cold_storage.png');

        this.gameTexture.uiButtonSelect = new IgeTexture('../assets/textures/ui/uiButton_select.png');
        this.gameTexture.uiButtonMove = new IgeTexture('../assets/textures/ui/uiButton_move.png');
        this.gameTexture.uiButtonDelete = new IgeTexture('../assets/textures/ui/uiButton_delete.png');
        this.gameTexture.uiButtonHouse = new IgeTexture('../assets/textures/ui/uiButton_house.png');
        this.gameTexture.uiButtonWater = new IgeTexture('../assets/textures/ui/uiButton_water.png');
        this.gameTexture.uiButtonBattle = new IgeTexture('../assets/textures/ui/uiButton_battle.png');
        this.gameTexture.uiButtonFertilizing = new IgeTexture('../assets/textures/ui/uiButton_fertilizing.png');

        this.gameTexture.ui_seeds_tomato = new IgeTexture('../assets/textures/seeds/Tomato.png');
        this.gameTexture.ui_seeds_corn = new IgeTexture('../assets/textures/seeds/Corn.png');
        this.gameTexture.ui_seeds_wheat = new IgeTexture('../assets/textures/seeds/Wheat.png');

        this.gameTexture.uiButtonTree = new IgeTexture('../assets/textures/ui/ui_seeds.png');

        this.gameTexture.seeds_tomato = new IgeTexture('../assets/textures/seeds/seeds_tomato_0.png');
        this.gameTexture.seeds_tomato_1 = new IgeTexture('../assets/textures/seeds/seeds_tomato_1.png');
        this.gameTexture.seeds_tomato_2 = new IgeTexture('../assets/textures/seeds/seeds_tomato_2.png');
        this.gameTexture.seeds_tomato_3 = new IgeTexture('../assets/textures/seeds/seeds_tomato_3.png');
        this.gameTexture.seeds_tomato_decay = new IgeTexture('../assets/textures/seeds/seeds_tomato_decay.png');

        this.gameTexture.seeds_corn = new IgeTexture('../assets/textures/seeds/seeds_corn_0.png');
        this.gameTexture.seeds_corn_1 = new IgeTexture('../assets/textures/seeds/seeds_corn_1.png');
        this.gameTexture.seeds_corn_2 = new IgeTexture('../assets/textures/seeds/seeds_corn_2.png');
        this.gameTexture.seeds_corn_3 = new IgeTexture('../assets/textures/seeds/seeds_corn_3.png');
        this.gameTexture.seeds_corn_decay = new IgeTexture('../assets/textures/seeds/seeds_corn_decay.png');

        this.gameTexture.seeds_wheat = new IgeTexture('../assets/textures/seeds/seeds_wheat_0.png');
        this.gameTexture.seeds_wheat_1 = new IgeTexture('../assets/textures/seeds/seeds_wheat_1.png');
        this.gameTexture.seeds_wheat_2 = new IgeTexture('../assets/textures/seeds/seeds_wheat_2.png');
        this.gameTexture.seeds_wheat_3 = new IgeTexture('../assets/textures/seeds/seeds_wheat_3.png');
        this.gameTexture.seeds_wheat_decay = new IgeTexture('../assets/textures/seeds/seeds_wheat_decay.png');

        this.gameTexture.leftBar = new IgeFontSheet('../assets/textures/fonts/verdana_10pt.png', 0);
        this.gameTexture.coins = new IgeTexture('../assets/textures/ui/coins.png');

    },

    setupScene: function () {
        // Create the scene
        this.mainScene = new IgeScene2d()
			.id('mainScene');

        // Resize the background and then create a background pattern
        this.gameTexture.background1.resize(40, 30);
        this.backgroundScene = new IgeScene2d()
			.id('backgroundScene')
			.depth(0)
			.backgroundPattern(this.gameTexture.background1, 'repeat', true, true)
			.ignoreCamera(true) // We want the scene to remain static
			.mount(this.mainScene);

        //this.objectScene = new IgeScene2d()
        //	.id('objectScene')
        //	.depth(1)
        //	.isometric(false)
        //	.mount(this.mainScene);

        // Create the main viewport
        this.vp1 = new IgeViewport()
			.id('vp1')
			.addComponent(IgeMousePanComponent)
			.addComponent(IgeMouseZoomComponent)
			.mousePan.enabled(true)
			.mouseZoom.enabled(false)
			.autoSize(true)
			.scene(this.mainScene)
			.drawBounds(false)
			.drawBoundsData(false)
			.mount(ige);

        // Create some listeners for when the viewport is being panned
        // so that we don't create an entity accidentally after a mouseUp
        // occurs if we were panning
        this.vp1.mousePan.on('panStart', function () {
            // Store the current cursor mode
            ige.client.data('tempCursorMode', ige.client.data('cursorMode'));

            // Switch the cursor mode
            ige.client.data('cursorMode', 'panning');
            ige.input.stopPropagation();
        });

        this.vp1.mousePan.on('panEnd', function () {
            // Switch the cursor mode back
            ige.client.data('cursorMode', ige.client.data('tempCursorMode'));
            ige.input.stopPropagation();
        });

        // Create the scene that the game items will
        // be mounted to (like the tile map). This scene
        // is then mounted to the main scene.
        this.gameScene = new IgeScene2d()
			.id('gameScene')
			.depth(1)
			.translateTo(0, -360, 0)
			.mount(this.mainScene);

        // Create the UI scene that will have all the UI
        // entities mounted to it. This scene is at a higher
        // depth than gameScene so it will always be rendered
        // "on top" of the other game items which will all
        // be mounted to off of gameScene somewhere down the
        // scenegraph.
        this.uiScene = new IgeScene2d()
			.id('uiScene')
			.depth(2)
			.ignoreCamera(true)
			.mount(this.mainScene);

        // Create a collision map. We don't mount this to
        // our scene because we are only going to use it
        // for storing where buildings CAN be placed since
        // the island background has limited space to build.
        // TODO: Fill the collision map with data that denotes the sections of the map that CAN be used for building, then add logic in to check that when a build request happens, it is in an area of this map.
        this.collisionMap1 = new IgeMap2d();

        // Create the tile map that will store which buildings
        // are occupying which tiles on the map. When we create
        // new buildings we mount them to this tile map. The tile
        // map also has a number of mouse event listeners to
        // handle things like building new objects in the game.
        this.tileMap1 = new IgeTileMap2d()
			.id('tileMap1')
			.layer(2)
			.isometricMounts(true)
			.tileWidth(30)
			.tileHeight(30)
			.drawGrid(40)
			.drawMouse(true)
        //.backgroundPattern(this.gameTexture.background0, 'repeat', true, true)
			.highlightOccupied(false)
			.mouseOver(this._mapOnMouseOver)
			.mouseUp(this._mapOnMouseUp)
			.mount(this.gameScene);

        /*
        Just so we're all clear about what just happened, we have
        created a scenegraph that looks like this:

        ige (IgeEntity)
        |+ vp1 (IgeViewport)
        |+ mainScene (IgeScene)
        |+ gameScene (IgeScene)
        |	+ backDrop (IgeEntity)
        |	+ tileMap1 (IgeTileMap2d)
        |+ uiScene (IgeScene)

        For a full readout of the scenegraph at any time, use the
        JS console and issue the command: ige.scenegraph();
        */
    },

    /**
    * Creates the UI entities that the user can interact with to
    * perform certain tasks like placing and removing buildings.
    */

    setupUi: function () {
        var widthDefault = 190;
        var heightDefault = 15;

        var widthLeftBar = 150;
        var heightLeftBar = '100%';

        var leftDefault = 10;

        // Left bar
        this.leftBar = new IgeUiEntity()
			.id('leftBar')
			.depth(0)
			.backgroundColor('#004050')
			.left(0)
			.top(40)
			.width(widthLeftBar)
			.height(heightLeftBar)
			.mount(this.uiScene);
        // Nickname
        this.txtPlayerNickname = new IgeUiTextBox()
            .id('txtPlayerNickname')
            .fontSheet(this.gameTexture.leftBar)
			.top(5)
            .left(leftDefault)
			.width(widthDefault)
			.height(heightDefault)
            .value('Hello')
            .mount(this.leftBar);
        // Level
        this.txtPlayerLevel = new IgeUiTextBox()
            .id('txtPlayerLevel')
            .fontSheet(this.gameTexture.leftBar)
			.left(leftDefault)
			.top(this.txtPlayerNickname.top() * 2 + heightDefault)
			.width(widthDefault)
			.height(heightDefault)
            .mount(this.leftBar);
        // Money
        this.imgPlayerMoney = new IgeUiRadioButton()
			.id('imgPlayerMoney')
			.left(5)
			.top(40)
			.width(50)
			.height(50)
			.texture(this.gameTexture.coins)
            .mount(this.leftBar);
        this.txtPlayerMoney = new IgeUiTextBox()
            .id('txtPlayerMoney')
            .fontSheet(this.gameTexture.leftBar)
			.left(this.imgPlayerMoney._width)
			.top(40)
			.width(100)
			.height(this.imgPlayerMoney._height)
            .mount(this.leftBar);
        // Item
        this.imageItem = new IgeUiEntity()
			.id('imageItem')
			.depth(0)
			.left(20)
			.top(this.txtPlayerNickname.top() * 3 + heightDefault + 60)
			.width(100)
			.height(100)
            .mount(this.leftBar);
        this.txtItemLine1 = new IgeUiTextBox()
            .id('txtItemLine1')
            .fontSheet(this.gameTexture.leftBar)
			.left(20)
			.top(200)
			.width(150)
			.height(heightDefault)
            .mount(this.leftBar);
        this.txtItemLine2 = new IgeUiTextBox()
            .id('txtItemLine2')
            .fontSheet(this.gameTexture.leftBar)
			.left(20)
			.top(230)
			.width(150)
			.height(heightDefault)
            .mount(this.leftBar);

        this.txtHarvest = new IgeUiTextBox()
            .id('txtHarvest')
            .fontSheet(this.gameTexture.leftBar)
			.left(15)
			.top(260)
			.width(120)
            .value('Start harvesting')
			.height(40)
			.backgroundColor('#000000')
			.borderColor('#ffffff')
			.borderWidth(1)
			.borderRadius(5)
            .mouseOver(function () { this.backgroundColor('#99CC00'); ige.input.stopPropagation(); })
            .mouseOut(function () { this.backgroundColor('#000000'); ige.input.stopPropagation(); })
            .mouseUp(function () { start_harvest(); }) //console.log('Clicked ' + this.id());
        ;
        //.mount(this.leftBar);


        // Create the top menu bar
        this.menuBar = new IgeUiEntity()
			.id('menuBar')
			.depth(10)
			.backgroundColor('#333333')
			.backgroundColor('#006200')
			.left(0)
			.top(0)
			.width('100%')
			.height(40)
        //.mouseDown(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        //.mouseUp(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        //.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
			.mount(this.uiScene);

        // Create the menu bar buttons
        this.uiButtonSelect = new IgeUiRadioButton()
			.id('uiButtonSelect')
			.left(3)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonSelect)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'select') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'select') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'select');
			    this.backgroundColor('#00baff');
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');
			    ige.client.data('currentlyHighlighted', false);
			})
			.select() // Start with this default selected
			.mount(this.menuBar);

        this.uiButtonMove = new IgeUiRadioButton()
			.id('uiButtonMove')
			.left(40)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonMove)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'move') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'move') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'move');
			    this.backgroundColor('#00baff');
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');
			    ige.client.data('currentlyHighlighted', false);
			})
			.mount(this.menuBar);

        this.uiButtonDelete = new IgeUiRadioButton()
			.id('uiButtonDelete')
			.left(77)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonDelete)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'delete') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'delete') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'delete');
			    this.backgroundColor('#00baff');
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');
			    ige.client.data('currentlyHighlighted', false);
			})
			.mount(this.menuBar);

        this.uiButtonWater = new IgeUiRadioButton()
			.id('uiButtonWater')
			.left(220)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonWater)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'water') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'water') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'water');
			    this.backgroundColor('#00baff');
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');
			    ige.client.data('currentlyHighlighted', false);
			})
			.mount(this.menuBar);
        this.uiButtonBattle = new IgeUiRadioButton()
			.id('uiButtonBattle')
			.left(270)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonBattle)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'battle') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'battle') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'battle');
			    this.backgroundColor('#00baff');
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');
			    ige.client.data('currentlyHighlighted', false);
			})
			.mount(this.menuBar);
                        
        this.uiButtonFertilizing = new IgeUiRadioButton()
			.id('uiButtonFertilizing')
			.left(320)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonFertilizing)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'fertilize') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'fertilize') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'fertilize');
			    this.backgroundColor('#00baff');
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');
			    ige.client.data('currentlyHighlighted', false);
			})
			.mount(this.menuBar);

        this.setupUi_BuildingsMenu();
        this.setupUi_SeedsMenu();

    },

    setupUi_BuildingsMenu: function () {
        // First, create an entity that will act as a drop-down menu
        this.uiMenuBuildings = new IgeUiEntity()
			.id('uiMenuBuildings')
			.left(120)
			.top(40)
			.width(200)
			.height(200)
			.backgroundColor('#222')
			.backgroundColor('#006200')
            .depth(100)
			.mount(this.uiScene)
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseOver(function () {
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
			.hide();

        // Now add the building "buttons" that will allow the user to select
        // the type of building they want to build
        new IgeUiRadioButton()
			.id('uiMenuBuildings_silo')
			.data('buildingType', 'Silo') // Set the class to instantiate from this button
			.top(0)
			.left(0)
			.texture(this.gameTexture.silo)
			.width(50, true)
			.mount(this.uiMenuBuildings)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuBuildings')
        // Define the button's mouse events
			.mouseOver(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('#6b6b6b');
			    }
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('');
			    }
			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    // Check if this item is already selected
			    //if (!this._uiSelected) {
			    // The item is NOT already selected so select it!
			    this.select();
			    //}
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'build');
			    this.backgroundColor('#00baff');

			    var tempItem = ige.client.createTemporaryItem(this.data('buildingType'))
					.opacity(0.7);

			    ige.client.data('ghostItem', tempItem);

			    ige.input.stopPropagation();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			});

        new IgeUiRadioButton()
			.id('uiMenuBuildings_coldstorage')
			.data('buildingType', 'Coldstorage') // Set the class to instantiate from this button
			.top(0)
			.left(50)
			.texture(this.gameTexture.coldstorage)
			.width(50, true)
			.mount(this.uiMenuBuildings)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuBuildings')
        // Define the button's mouse events
			.mouseOver(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('#6b6b6b');
			    }
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('');
			    }
			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    // Check if this item is already selected
			    //if (!this._uiSelected) {
			    // The item is NOT already selected so select it!
			    this.select();
			    //}
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'build');
			    this.backgroundColor('#00baff');

			    var tempItem = ige.client.createTemporaryItem(this.data('buildingType'))
					.opacity(0.7);

			    ige.client.data('ghostItem', tempItem);

			    ige.input.stopPropagation();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			});

        new IgeUiRadioButton()
			.id('uiMenuBuildings_barn')
			.data('buildingType', 'Barn') // Set the class to instantiate from this button
			.top(0)
			.left(100)
			.texture(this.gameTexture.barn)
			.width(50, true)
			.mount(this.uiMenuBuildings)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuBuildings')
        // Define the button's mouse events
			.mouseOver(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('#6b6b6b');
			    }
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('');
			    }
			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    // Check if this item is already selected
			    //if (!this._uiSelected) {
			    // The item is NOT already selected so select it!
			    this.select();
			    //}
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'build');
			    this.backgroundColor('#00baff');

			    var tempItem = ige.client.createTemporaryItem(this.data('buildingType'))
					.opacity(0.7);

			    ige.client.data('ghostItem', tempItem);

			    ige.input.stopPropagation();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			});

        this.uiButtonBuildings = new IgeUiRadioButton()
			.id('uiButtonBuildings')
			.left(124)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonHouse)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'build') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'build') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'build');
			    this.backgroundColor('#00baff');

			    // Show the buildings drop-down
			    ige.$('uiMenuBuildings').show();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    // Hide the buildings drop-down
			    ige.$('uiMenuBuildings').hide();

			    ige.client.data('currentlyHighlighted', false);
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			})
			.mount(this.menuBar);
    },

    setupUi_SeedsMenu: function () {
        // First, create an entity that will act as a drop-down menu
        this.uiMenuSeeds = new IgeUiEntity()
			.id('uiMenuSeeds')
			.left(165)
			.top(40)
			.width(200)
			.height(200)
			.backgroundColor('#222')
			.backgroundColor('#006200')
            .depth(100)
			.mount(this.uiScene)
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseOver(function () {
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
			.hide();

        // Now add the building "buttons" that will allow the user to select
        // the type of building they want to build
        new IgeUiRadioButton()
			.id('uiMenuSeeds_tomato')
			.data('seedType', 'Tomato') // Set the class to instantiate from this button
			.top(0)
			.left(0)
			.texture(this.gameTexture.ui_seeds_tomato)
			.width(50, true)
			.mount(this.uiMenuSeeds)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuSeeds')
        // Define the button's mouse events
			.mouseOver(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('#6b6b6b');
			    }
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('');
			    }
			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    // Check if this item is already selected
			    //if (!this._uiSelected) {
			    // The item is NOT already selected so select it!
			    this.select();
			    //}
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    //ige.client.data('cursorMode', 'seed');
			    this.backgroundColor('#00baff');
			    console.log("select Tomato")
			    var tempItem = ige.client.createTemporaryItem(this.data('seedType'))
					.opacity(0.7);

			    ige.client.data('ghostItem', tempItem);

			    ige.input.stopPropagation();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			});

        new IgeUiRadioButton()
			.id('uiMenuSeeds_corn')
			.data('seedType', 'Corn') // Set the class to instantiate from this button
			.top(0)
			.left(50)
			.texture(this.gameTexture.ui_seeds_corn)
			.width(50, true)
			.mount(this.uiMenuSeeds)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuSeeds')
        // Define the button's mouse events
			.mouseOver(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('#6b6b6b');
			    }
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('');
			    }
			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    // Check if this item is already selected
			    //if (!this._uiSelected) {
			    // The item is NOT already selected so select it!
			    this.select();
			    //}
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    //ige.client.data('cursorMode', 'seed');
			    this.backgroundColor('#00baff');

			    var tempItem = ige.client.createTemporaryItem(this.data('seedType'))
					.opacity(0.7);

			    ige.client.data('ghostItem', tempItem);

			    ige.input.stopPropagation();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			});

        new IgeUiRadioButton()
			.id('uiMenuSeeds_wheat')
			.data('seedType', 'Wheat') // Set the class to instantiate from this button
			.top(0)
			.left(100)
			.texture(this.gameTexture.ui_seeds_wheat)
			.width(50, true)
			.mount(this.uiMenuSeeds)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuSeeds')
        // Define the button's mouse events
			.mouseOver(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('#6b6b6b');
			    }
			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (!this._uiSelected) {
			        this.backgroundColor('');
			    }
			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    // Check if this item is already selected
			    //if (!this._uiSelected) {
			    // The item is NOT already selected so select it!
			    this.select();
			    //}
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    //ige.client.data('cursorMode', 'seed');
			    this.backgroundColor('#00baff');

			    var tempItem = ige.client.createTemporaryItem(this.data('seedType'))
					.opacity(0.7);

			    ige.client.data('ghostItem', tempItem);

			    ige.input.stopPropagation();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			});

        this.uiButtonSeeds = new IgeUiRadioButton()
			.id('uiButtonSeeds')
			.left(170)
			.top(3)
			.width(32)
			.height(32)
			.texture(ige.client.gameTexture.uiButtonTree)
        // Set the radio group so the controls will receive group events
			.radioGroup('menuControl')
			.mouseOver(function () {
			    if (ige.client.data('cursorMode') !== 'build') {
			        this.backgroundColor('#6b6b6b');
			    }

			    ige.input.stopPropagation();
			})
			.mouseOut(function () {
			    if (ige.client.data('cursorMode') !== 'build') {
			        this.backgroundColor('');
			    }

			    ige.input.stopPropagation();
			})
			.mouseDown(function () {
			    ige.input.stopPropagation();
			})
			.mouseUp(function () {
			    this.select();
			    ige.input.stopPropagation();
			})
			.mouseMove(function () { if (ige.client.data('cursorMode') !== 'panning') { ige.input.stopPropagation(); } })
        // Define the callback when the radio button is selected
			.select(function () {
			    ige.client.data('cursorMode', 'build');
			    this.backgroundColor('#00baff');

			    // Show the buildings drop-down
			    ige.$('uiMenuSeeds').show();
			})
        // Define the callback when the radio button is de-selected
			.deSelect(function () {
			    // Hide the buildings drop-down
			    ige.$('uiMenuSeeds').hide();

			    ige.client.data('currentlyHighlighted', false);
			    this.backgroundColor('');

			    // If we had a temporary building, kill it
			    var item = ige.client.data('ghostItem');
			    if (item) {
			        item.destroy();
			        ige.client.data('ghostItem', false);
			    }
			})
			.mount(this.menuBar);
    },

    setFarmer: function (playerId) {
        // Define a function that will be called when the
        //				// mouse cursor moves over one of our entities
        overFunc = function () {
            this.highlight(false);
            this.drawBounds(false);
            this.drawBoundsData(false);
        };

        // Define a function that will be called when the
        // mouse cursor moves away from one of our entities
        outFunc = function () {
            this.highlight(false);
            this.drawBounds(false);
            this.drawBoundsData(false);
        };

        // Create the 3d container that the player
        // entity will be mounted to

        //if (playerId != 'me') {

        //}
        //return;

        var player = new CharacterContainer()
					.id(playerId)
					.addComponent(PlayerComponent)
					.addComponent(IgePathComponent)
					.mouseOver(overFunc)
					.mouseOut(outFunc)
					.drawBounds(false)
					.drawBoundsData(false)
                    .mount(this.tileMap1);
        //log.info('before mount ' + player.id());

        //if (playerId == 'me') {
        //    
        //}

        //// Si je cree me, pour tout les jouerus pending je les cree
        //// sinon ajouter dans pending
        //if (playerId == 'me') {


        player.character.setType(characterType++);
        if (characterType == 7)
            characterType = 1;

        //console.info(playerId, player.classId());
        // Ajout du joueur dans un tableau
        players[playerId] = player;

        // Check if the tileMap1 is is iso mode
        if (this.tileMap1.isometricMounts()) {
            // Set the player to move isometrically
            player.isometric(true);
        }

        if (playerId == 'me')
            self.player = player;

        // Create a UI entity so we can test if clicking the entity will stop
        // event propagation down to moving the player. If it's working correctly
        // the player won't move when the entity is clicked.
        //				self.topBar1 = new IgeUiEntity()
        //					.id('topBar1')
        //					.depth(1)
        //					.backgroundColor('#474747')
        //					.top(0)
        //					.left(0)
        //					.width('100%')
        //					.height(30)
        //					.borderTopColor('#666666')
        //					.borderTopWidth(1)
        //					.backgroundPosition(0, 0)
        //					.mouseOver(function () {this.backgroundColor('#49ceff'); ige.input.stopPropagation(); })
        //					.mouseOut(function () {this.backgroundColor('#474747'); ige.input.stopPropagation(); })
        //					.mouseMove(function () { ige.input.stopPropagation(); })
        //					.mouseUp(function () { console.log('Clicked ' + this.id()); ige.input.stopPropagation(); })
        //					.mount(self.uiScene);

        // Set the camera to track the character with some
        // tracking smoothing turned on (100)
        if (playerId == 'me')
            this.vp1.camera.trackTranslate(self.player, 10);

        // Create a path finder and generate a path using
        // the collision map data
        if (playerId == 'me')
            this.pathFinder = new IgePathFinder();

        // Assign the path to the player
        if (playerId == 'me')
            self.player
					.path.drawPath(false) // Enable debug drawing the paths
					.path.drawPathGlow(true); // Enable path glowing (eye candy)

        // Register some event listeners for the path (these are for debug console logging so you
        // know what events are emitted by the path component and what they mean)
        //self.player.path.on('started', function () { console.log('Pathing started...'); });
        //self.player.path.on('stopped', function () { console.log('Pathing stopped.'); });
        //self.player.path.on('cleared', function () { console.log('Path data cleared.'); });
        //self.player.path.on('pointComplete', function () { console.log('Path point reached...'); });
        //self.player.path.on('pathComplete', function () { console.log('Path completed...'); });

        //self.player.path.on('traversalComplete', function () { this._entity.character.animation.stop(); console.log('Traversal of all paths completed.'); });
        if (playerId == 'me')
            self.player.path.on('traversalComplete', function () { this._entity.character.animation.stop(); console.log('Traversal of all paths completed.'); });

        // Some error events from the path finder (these are for debug console logging so you
        // know what events are emitted by the path finder class and what they mean)
        //self.pathFinder.on('noPathFound', function () { console.log('Could not find a path to the destination!'); });
        //self.pathFinder.on('exceededLimit', function () { console.log('Path finder exceeded allowed limit of nodes!'); });
        //self.pathFinder.on('pathFound', function () { console.log('Path to destination calculated...'); });

        //				 Start traversing the path!
        //				self.player.path.start();


        if (playerId == 'me') {
            meCreated = true;
            createPendingPlayers();
        }
        else {
            log.info(playerId + ' created');
        }

        sock_getFarmer();
        sock_getTabTile();
    },

    setupEntities: function () {
        // Create an entity
        //this.placeItem('Silo', 0, 6);
        //this.placeItem('Barn', 2, 6);
        //this.placeItem('Coldstorage', 5, 6);
        //this.placeItem('Tomato', 0, 8);
    },

    /**
    * Place a building on the map.
    * @param type
    * @param tileX
    * @param tileY
    * @return {*}
    */
    placeItem: function (dbItem) {// old placeItem: function (type, tileX, tileY) {
        //console.info('placeItem %s', dbItem.type);
        //console.info(dbItem);
        /*
        // old
        var item = new this[type](this.tileMap1, tileX, tileY).place();
        this.obj.push(item);

        return item;
        */
        var item = new this[dbItem.type](this.tileMap1, dbItem.x, dbItem.y).place();
        item.dbId = dbItem.dbId;
        item.farmer_id = dbItem.farmer_id;

        if (isCrop(item)) {
            arrCrops.push(item);
            updateCropImage(item, dbItem.maturity);
            item.maturity = dbItem.maturity;
        }
        if (isBuilding(item)) {
            arrBuildings.push(item);
            item.stored_quantity = dbItem.stored_quantity;
        }

        return item;
    },

    /**
    * Removes an item from the tile map and destroys the entity
    * from memory.
    * @param tileX
    * @param tileY
    */
    removeItem: function (tileX, tileY) {
        var item = this.itemAt(tileX, tileY);
        if (item) {
            item.destroy();
        }
    },

    /**
    * Returns the item occupying the tile co-ordinates of the tile map.
    * @param tileX
    * @param tileY
    */
    itemAt: function (tileX, tileY) {
        // Return the data at the map's tile co-ordinates
        return this.tileMap1.map.tileData(tileX, tileY);
    },

    /**
    * Creates and returns a temporary item that can be used
    * to indicate to the player where their item will be built.
    * @param type
    */
    createTemporaryItem: function (type) {
        // Create a new item at a far off tile position - it will
        // be moved to follow the mouse cursor anyway but it's cleaner
        // to create it off-screen first.
        return new this[type](this.tileMap1, -1000, -1000);
    },

    /**
    * Handles when the mouse up event occurs on our map (tileMap1).
    * @param x
    * @param y
    * @private
    */
    _mapOnMouseUp: function (x, y) {
        canWalk = !(x < 0 || y < 0); // le joueur ne peut pas se déplacer en dehors de la map
        // Check what mode our cursor is in
        switch (ige.client.data('cursorMode')) {
            case 'harvest':
                canWalk = false;
                // Récupérer l'item qu'on veut récolter
                var item = ige.client.itemAt(x, y);
                harvest(item);
                break;

            case 'select':
                //canWalk = true;
                console.log('select'); ;
                var item = ige.client.itemAt(x, y);
                lastSelectedItemForInfoDisplay = selectedItemForInfoDisplay;
                selectedItemForInfoDisplay = item;
                console.log('selectedItemForInfoDisplay', selectedItemForInfoDisplay);
                displayItemInfo(item);
                
                if (item != undefined)
                    self.canWalk = false;

                break;

            case 'move':
                // Check if we are already moving an item 
                if (!ige.client.data('moveItem')) {
                    // We're not already moving an item so check if the user
                    // just clicked on a building
                    var item = ige.client.itemAt(x, y),
						apiUrl;

                    if (item) {
                        // The user clicked on a building so set this as the
                        // building we are moving.
                        ige.client.data('moveItem', item);
                        ige.client.data('moveItemX', item.data('tileX'));
                        ige.client.data('moveItemY', item.data('tileY'));
                    }
                } else {
                    // We are already moving a building, place this building
                    // down now
                    var item = ige.client.data('moveItem'),
						moveX = item.data('lastMoveX'),
						moveY = item.data('lastMoveY');

                    item.moveTo(moveX, moveY);

                    // Ask the server to move the item
                    // **SERVER-CALL**
                    apiUrl = ''; //apiUrl = 'yourServerSideApiUrl'; // E.g. http://www.myserver.com/api/process.php
                    if (apiUrl) {
                        $.ajax(apiUrl, {
                            dataType: 'json',
                            data: {
                                action: 'move',
                                fromX: ige.client.data('moveItemX'),
                                fromY: ige.client.data('moveItemY'),
                                classId: item._classId,
                                tileX: item.data('tileX'),
                                tileY: item.data('tileY')
                            },
                            success: function (data, status, requestObject) {
                                // Do what you want with the server return value
                            }
                        });
                    }

                    // Clear the data
                    ige.client.data('moveItem', '');
                }
                break;

            case 'delete':
                canWalk = false;
                var item = ige.client.itemAt(x, y),
					apiUrl;

                if (item) {
                    // Ask the server to remove the item
                    // **SERVER-CALL**
                    apiUrl = ''; //apiUrl = 'yourServerSideApiUrl'; // E.g. http://www.myserver.com/api/process.php
                    if (apiUrl) {
                        $.ajax(apiUrl, {
                            dataType: 'json',
                            data: {
                                action: 'delete',
                                classId: item._classId,
                                tileX: item.data('tileX'),
                                tileY: item.data('tileY')
                            },
                            success: function (data, status, requestObject) {
                                // Do what you want with the server return value
                            }
                        });
                    }

                    this.data('currentlyHighlighted', false);

                    // Remove the item from the engine
                    item.destroy();
                }
                break;
            case 'battle':
                self.canWalk = false;
                var length = self.tabTile.length;
                var canBattle = true;
                for (var i = 0; i < length; i++) {
                    if (self.tabTile[i].position_x == x && self.tabTile[i].position_y == y){
                        canBattle = false;
                        
                    }
                }
                
                if(canBattle==false){
                    console.log("Ce terrain vous appartiens deja");
                }else{
                    console.log("vous pouvez attaquez ce terrain");
                    sock_battle(x, y, self.id_farmer);
                }
                break;
            case 'fertilize':
                self.canWalk = false;
                var canFertilize = false;
                var length = self.tabTile.length;
                for (var i = 0; i < length; i++) {
                    if (self.tabTile[i].position_x == x && self.tabTile[i].position_y == y){
                        canFertilize = true;
                    }
                }
                if(canFertilize==true){
                    console.log("fertilize");
                }else{
                    console.log("ne peut pas fertilize");
                }
                
                break;
            case 'water':
                self.canWalk = false;
                var item = ige.client.data('ghostItem'),
					tempItem,
					apiUrl;
                                        
                var length = self.tabTile.length;
                var index = null;
                for (var i = 0; i < length; i++) {
                    if (self.tabTile[i].position_x == x && self.tabTile[i].position_y == y)
                        index = i;
                }
                if(index !=null){
                    if(self.tabTile[index].humidity < 90){
                        self.tabTile[index].humidity += 10;
                        console.log("humidity " +self.tabTile[index].humidity);
                        sock_watering(x, y);
                    }
                }
//                console.log("watering : ("+x+","+y+")");
                
                break;
            case 'build':
                self.canWalk = false;
                var item = ige.client.data('ghostItem'),
					tempItem,
					apiUrl;

                if (item && item.data('tileX') !== -1000 && item.data('tileY') !== -1000) {
                    if (item.data('tileX') > -1 && item.data('tileY') > -1) {
                        // TODO: Use the collision map to check that the tile location is allowed for building! At the moment you can basically build anywhere and that sucks!
                        // Clear out reference to the ghost item

                        var canBuild = false;
                        var length = self.tabTile.length;
                        for (var i = 0; i < length; i++) {
                            if (self.tabTile[i].position_x == item.data('tileX') && self.tabTile[i].position_y == item.data('tileY'))
                                canBuild = true;
                        }

                        if (canBuild == true) {


                            ige.client.data('ghostItem', false);

                            // Turn the ghost item into a "real" building
                            item.opacity(1)
                                                            .place();

                            if (isBuilding(item)) {
                                // Prévenir le serveur de la construction du nouveau batiment
                                console.log('building');
                                sock_newBuilding(item.classId(), item.data('tileX'), item.data('tileY'), item);
                            }
                            else if (isCrop(item)) {
                                console.log('crop');
                                // Informer le serveur qu'on a planté quelque chose
                                sock_newCrop(item.classId(), item.data('tileX'), item.data('tileY'), item)
                            }

                            // Now that we've placed a building, ask the server
                            // to ok / save the request. If the server doesn't
                            // tell us anything then the building is obviously ok!
                            // **SERVER-CALL**
                            apiUrl = ''; //apiUrl = 'yourServerSideApiUrl'; // E.g. http://www.myserver.com/api/process.php
                            if (apiUrl) {
                                $.ajax(apiUrl, {
                                    dataType: 'json',
                                    data: {
                                        action: 'build',
                                        classId: item._classId,
                                        tileX: item.data('tileX'),
                                        tileY: item.data('tileY')
                                    },
                                    success: function (data, status, requestObject) {
                                        // Do what you want with the server return value
                                    }
                                });
                            }

                            // Now create a new temporary building
                            tempItem = ige.client.createTemporaryItem(item._classId) // SkyScraper, Electricals etc
                                                            .opacity(0.7);

                            ige.client.data('ghostItem', tempItem);
                        } else {
                            console.log("vous ne pouvez pas construire sur un terrain qui ne vous appartiens pas");
                        }
                    }
                }
                break;
        }
    },

    /**
    * Handles when the mouse over event occurs on our map (tileMap1).
    * @param x
    * @param y
    * @private
    */
    _mapOnMouseOver: function (x, y) {
        switch (ige.client.data('cursorMode')) {
            case 'select':
                // If we already have a selection, un-highlight it
                if (this.data('currentlyHighlighted')) {
                    this.data('currentlyHighlighted').highlight(false);
                }

                // Highlight the building at the map x, y
                var item = ige.client.itemAt(x, y);
                if (item) {
                    item.highlight(true);
                    this.data('currentlyHighlighted', item);
                }
                break;

            case 'delete':
                // If we already have a selection, un-highlight it
                if (this.data('currentlyHighlighted')) {
                    this.data('currentlyHighlighted').highlight(false);
                }

                // Highlight the building at the map x, y
                var item = ige.client.itemAt(x, y);
                if (item) {
                    item.highlight(true);
                    this.data('currentlyHighlighted', item);
                }
                break;

            case 'move':
                var item = ige.client.data('moveItem'),
					map = ige.client.tileMap1.map;

                if (item) {
                    // Check if the current tile is occupied or not
                    if (!map.collision(x, y, item.data('tileWidth'), item.data('tileHeight')) || map.collisionWithOnly(x, y, item.data('tileWidth'), item.data('tileHeight'), item)) {
                        // We are currently moving an item so update it's
                        // translation
                        item.translateToTile(x, y);

                        // Store the last position we accepted
                        item.data('lastMoveX', x);
                        item.data('lastMoveY', y);
                    }
                }
                break;

            case 'build':
                var item = ige.client.data('ghostItem');
                if (item) {
                    // We have a ghost item so move it to where the
                    // mouse is!

                    // Check the tile is not currently occupied!
                    if (!ige.client.tileMap1.map.collision(x, y, item.data('tileWidth'), item.data('tileHeight'))) {
                        // The tile is not occupied so move to it!
                        item.data('tileX', x)
							.data('tileY', y)
							.translateToTile(x, y, 0);
                    }
                }
                break;
        }
    }
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Client; }