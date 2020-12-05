const config = {
	type: Phaser.WEBGL,
	width: '100%',
	height: '100%',
	scale: {
		mode: Phaser.Scale.ENVELOP,
		autoCenter: Phaser.Scale.CENTER_BOTH
	},
	backgroundColor: '#2d2d2d',
	parent: 'canvas-wrapper',
	pixelArt: true,
	scene: {
		preload: preload,
		create: create,
		update: update
	}
}

let controls

function preload() {
	this.load.image('tiles', 'assets/images/iso-64x64-outside.png')
	this.load.image('tiles2', 'assets/images/iso-64x64-building.png')
	// noinspection JSUnresolvedFunction
	this.load.tilemapTiledJSON('map', 'assets/images/isorpg.json')
}

function create() {
	let map = this.add.tilemap('map')

	console.log(map)

	let tileset1 = map.addTilesetImage('iso-64x64-outside', 'tiles')
	let tileset2 = map.addTilesetImage('iso-64x64-building', 'tiles2')

	let layer1 = map.createLayer('Tile Layer 1', [ tileset1, tileset2 ])
	let layer2 = map.createLayer('Tile Layer 2', [ tileset1, tileset2 ])
	let layer3 = map.createLayer('Tile Layer 3', [ tileset1, tileset2 ])
	let layer4 = map.createLayer('Tile Layer 4', [ tileset1, tileset2 ])
	let layer5 = map.createLayer('Tile Layer 5', [ tileset1, tileset2 ])

	let cursors = this.input.keyboard.createCursorKeys()

	this.cameras.main.setZoom(2)

	let controlConfig = {
		camera: this.cameras.main,
		left: cursors.left,
		right: cursors.right,
		up: cursors.up,
		down: cursors.down,
		acceleration: 0.04,
		drag: 0.0005,
		maxSpeed: 0.7
	}

	controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig)
}

function update(time, delta) {
	controls.update(delta)
}

let game = new Phaser.Game(config)