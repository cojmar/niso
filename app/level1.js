export default class extends Phaser.Scene {
    constructor(config) {
        super(config)
        this.layers = []
    }

    preload() {
        this.load.setBaseURL('./assets/images');
        this.load.image('tiles', 'isometric-grass-and-water.png');
        this.load.tilemapTiledJSON('map', 'isometric-grass-and-water.json');
    }
    init_cursor() {
        var cursors = this.input.keyboard.createCursorKeys();

        var controlConfig = {
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            acceleration: 0.04,
            drag: 0.0005,
            maxSpeed: 0.7
        };
        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        return this
    }
    make_map() {
        this.map = this.make.tilemap({ key: 'map' })
        let tiles = this.map.addTilesetImage('isometric_grass_and_water', 'tiles');
        this.layers.push(this.map.createLayer(0, tiles, this.map.widthInPixels / 2, 0));
        return this
    }
    add_player(data) {
        if (data) {

        }

        return this
    }

    create(data) {
        this.make_map().add_player().init_cursor()


        this.cameras.main.setZoom(1.2);
    }

    update(time, delta) {
        this.controls.update(delta);
    }
}