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

		// cam.setRoundPixels(true)
		// cam.setBounds(-map.widthInPixels, 0, map.widthInPixels, map.heightInPixels)
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

		this.gui = this.gui_render({layer1, layer2, layer3, layer4, layer5, cam})
	}

	gui_render(data) {
		// noinspection JSUnresolvedFunction
		const gui = new Tweakpane()

		const layer_controls = gui.addFolder({
			title: 'Layers',
			expanded: false
		})

		layer_controls.addInput(data.layer1, 'alpha', {
			label: 'Layer 1 Alpha',
			min: 0,
			max: 1
		})

		layer_controls.addInput(data.layer2, 'alpha', {
			label: 'Layer 2 Alpha',
			min: 0,
			max: 1
		})

		layer_controls.addInput(data.layer3, 'alpha', {
			label: 'Layer 3 Alpha',
			min: 0,
			max: 1
		})

		layer_controls.addInput(data.layer4, 'alpha', {
			label: 'Layer 4 Alpha',
			min: 0,
			max: 1
		})

		layer_controls.addInput(data.layer5, 'alpha', {
			label: 'Layer 5 Alpha',
			min: 0,
			max: 1
		})

		const camera_controls = gui.addFolder({
			title: 'Camera',
			expanded: false
		})

		camera_controls.addInput(data.cam, 'x')
		camera_controls.addInput(data.cam, 'y')
		camera_controls.addInput(data.cam, 'scrollX')
		camera_controls.addInput(data.cam, 'scrollY')

		camera_controls.addInput(data.cam, 'rotation', {
			min: 0,
			step: 0.01
		})

		camera_controls.addInput(data.cam, 'zoom', {
			min: 0.125,
			max: 5,
			step: 0.125
		})

		const controls = {
			controls1: 'Cursors to move',
			controls2: 'Q & E to zoom',
			controls3: 'MouseWheel to zoom'
		}

		const help_controls = gui.addFolder({
			title: 'Help',
			expanded: true
		})

		help_controls.addInput(controls, 'controls1', {
			label: 'Keyboard'
		})

		help_controls.addInput(controls, 'controls3', {
			label: 'Mouse'
		})

		return gui
	}

	update(time, delta) {
		this.gui.refresh()
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