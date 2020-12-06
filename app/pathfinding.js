class MMORPG extends Phaser.Scene {
	constructor()
	{
		super()

		this.controls = null
	}

	preload() {
		this.load.image('tiles', 'assets/images/iso-64x64-outside.png')
		this.load.image('tiles2', 'assets/images/iso-64x64-building.png')
		// noinspection JSUnresolvedFunction
		this.load.tilemapTiledJSON('map', 'assets/images/isorpg.json')
		// noinspection JSUnresolvedFunction
		this.load.tilemapTiledJSON('map2', 'assets/images/isotest.json')
	}

	create() {
		let map = this.add.tilemap('map')

		let tileset1 = map.addTilesetImage('iso-64x64-outside', 'tiles')
		let tileset2 = map.addTilesetImage('iso-64x64-building', 'tiles2')

		let layer1 = map.createLayer('Tile Layer 1', [ tileset1, tileset2 ])
		let layer2 = map.createLayer('Tile Layer 2', [ tileset1, tileset2 ])
		let layer3 = map.createLayer('Tile Layer 3', [ tileset1, tileset2 ])
		// let layer3 = map.createLayer('Tree Tops', [ tileset1, tileset2 ])
		let layer4 = map.createLayer('Tile Layer 4', [ tileset1, tileset2 ])
		let layer5 = map.createLayer('Tile Layer 5', [ tileset1, tileset2 ])

		let cursors = this.input.keyboard.createCursorKeys()

		const cam = this.cameras.main

		const gui = new dat.GUI()

		const controls = {
			controls1: 'Cursors to move',
			controls2: 'Q & E to zoom',
			controls3: 'MouseWheel to zoom'
		}

		const help = gui.addFolder('Camera')
		help.add(cam, 'x').listen()
		help.add(cam, 'y').listen()
		help.add(cam, 'scrollX').listen()
		help.add(cam, 'scrollY').listen()
		help.add(cam, 'rotation').min(0).step(0.01).listen()
		help.add(cam, 'zoom', 0.125, 5).step(0.125).listen()
		help.add(controls, 'controls1')
		// help.add(controls, 'controls2')
		help.add(controls, 'controls3')
		help.open()

		//this.cameras.main.setRoundPixels(true)
		// this.cameras.main.setBounds(-map.widthInPixels, 0, map.widthInPixels, map.heightInPixels)
		cam.centerOn(0, map.heightInPixels / 2)
		cam.setZoom(2)

		let controlConfig = {
			camera: cam,
			left: cursors.left,
			right: cursors.right,
			up: cursors.up,
			down: cursors.down,
			// zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
			// zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
			acceleration: 0.04,
			drag: 0.0005,
			maxSpeed: 0.7
		}

		this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig)

		// noinspection JSUnusedLocalSymbols
		this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
			cam.zoom += deltaY * -0.00125
		})
	}

	update(time, delta) {
		this.controls.update(delta)
	}
}

new Phaser.Game({
	type: Phaser.WEBGL,
	width: '100%',
	height: '100%',
	backgroundColor: '#2d2d2d',
	parent: 'canvas-wrapper',
	pixelArt: true,
	scale: {
		mode: Phaser.Scale.ENVELOP,
		autoCenter: Phaser.Scale.CENTER_BOTH
	},
	physics: {
		default: 'arcade',
	},
	scene: [MMORPG]
})