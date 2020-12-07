export default class extends Phaser.Scene {
    constructor(config) {
        super(config)
        this.layers = []
        this.players = []
    }

    preload() {
        this.load.setBaseURL('./assets/images');
        this.load.image('tiles', 'isometric-grass-and-water.png');
        this.load.tilemapTiledJSON('map', 'isometric-grass-and-water.json');
        this.load.spritesheet('skeleton', 'skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    }
    init_skeleton() {

        this.skeleton = new Phaser.Class({
            scene: this,
            anims: {
                idle: {
                    startFrame: 0,
                    endFrame: 4,
                    speed: 0.2
                },
                walk: {
                    startFrame: 4,
                    endFrame: 12,
                    speed: 0.15
                },
                attack: {
                    startFrame: 12,
                    endFrame: 20,
                    speed: 0.11
                },
                die: {
                    startFrame: 20,
                    endFrame: 28,
                    speed: 0.2
                },
                shoot: {
                    startFrame: 28,
                    endFrame: 32,
                    speed: 0.1
                }
            },
            directions: {
                west: { offset: 0, x: -2, y: 0, opposite: 'east' },
                northWest: { offset: 32, x: -2, y: -1, opposite: 'southEast' },
                north: { offset: 64, x: 0, y: -2, opposite: 'south' },
                northEast: { offset: 96, x: 2, y: -1, opposite: 'southWest' },
                east: { offset: 128, x: 2, y: 0, opposite: 'west' },
                southEast: { offset: 160, x: 2, y: 1, opposite: 'northWest' },
                south: { offset: 192, x: 0, y: 2, opposite: 'north' },
                southWest: { offset: 224, x: -2, y: 1, opposite: 'northEast' }
            },
            Extends: Phaser.GameObjects.Image,

            initialize:

                function skeleton(scene, x, y, motion, direction, distance) {
                this.startX = x;
                this.startY = y;
                this.distance = distance;

                this.motion = motion;
                this.anim = this.anims[motion];
                this.direction = this.directions[direction];
                this.speed = 0.15;
                this.f = this.anim.startFrame;

                Phaser.GameObjects.Image.call(this, scene, x, y, 'skeleton', this.direction.offset + this.f);

                this.depth = y + 64;

                scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
            },

            changeFrame: function() {
                this.f++;

                var delay = this.anim.speed;

                if (this.f === this.anim.endFrame) {
                    switch (this.motion) {
                        case 'walk':
                            this.f = this.anim.startFrame;
                            this.frame = this.texture.get(this.direction.offset + this.f);
                            this.scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
                            break;

                        case 'attack':
                            //delay = Math.random() * 2;
                            this.scene.time.delayedCall(delay * 1000, () => {
                                this.resetAnimation()
                                this.setMotion('walk')
                            }, [], this);

                            break;

                        case 'idle':
                            delay = 0.5 + Math.random();
                            this.scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                            break;

                        case 'die':
                            delay = 6 + Math.random() * 6;
                            this.scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                            break;
                    }
                } else {
                    this.frame = this.texture.get(this.direction.offset + this.f);

                    this.scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
                }
            },

            resetAnimation: function() {
                this.f = this.anim.startFrame;

                this.frame = this.texture.get(this.direction.offset + this.f);

                this.scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
            },
            setMotion: function(motion) {
                this.motion = motion;
                this.anim = this.anims[motion];
                //this.speed = 0.15;
                this.f = this.anim.startFrame;
                this.frame = this.texture.get(this.direction.offset + this.f);
            },
            update: function() {
                if (this.motion === 'walk') {
                    this.x += this.direction.x * this.speed;

                    if (this.direction.y !== 0) {
                        this.y += this.direction.y * this.speed;
                        this.depth = this.y + 64;
                    }

                    //  Walked far enough?


                    if (Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y) >= this.distance) {
                        this.direction = this.directions[this.direction.opposite];
                        this.f = this.anim.startFrame;
                        this.frame = this.texture.get(this.direction.offset + this.f);
                        this.startX = this.x;
                        this.startY = this.y;
                    }
                }
            }

        });
        return this
    }
    init_cursor() {
        this.input.keyboard.on('keydown-SPACE', () => {
            this.players[0].setMotion('attack')
        });
        this.input.keyboard.on('keyup-SPACE', () => {
            //this.players[0].setMotion('walk')
        });

        this.input.keyboard.on('keydown-W', () => {
            this.players[0].direction = this.players[0].directions['northEast']
        });
        this.input.keyboard.on('keydown-A', () => {
            this.players[0].direction = this.players[0].directions['northWest']
        });
        this.input.keyboard.on('keydown-S', () => {
            this.players[0].direction = this.players[0].directions['southWest']
        });
        this.input.keyboard.on('keydown-D', () => {
            this.players[0].direction = this.players[0].directions['southEast']
        });
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
    cartesianToIsometric(cartPt) {
        let tempPt = new Phaser.Point();
        tempPt.x = cartPt.x - cartPt.y;
        tempPt.y = (cartPt.x + cartPt.y) / 2;
        return (tempPt);
    }
    isometricToCartesian(isoPt) {
        let tempPt = new Phaser.Point();
        tempPt.x = (2 * isoPt.y + isoPt.x) / 2;
        tempPt.y = (2 * isoPt.y - isoPt.x) / 2;
        return (tempPt);
    }
    find_path(event) {
        return false
        let pos = Object.assign({}, event.position)
        let isoPt = new Phaser.Point(pos.x - borderOffset.x, pos.y - borderOffset.y)
        let tapPos = isometricToCartesian(isoPt)

        console.log(tapPos)

        this.players[0].x = pos.x
        this.players[0].y = pos.y

        return
        //if (isFindingPath || isWalking) return;


        tapPos = isometricToCartesian(isoPt);
        tapPos.x -= tileWidth / 2; //adjustment to find the right tile for error due to rounding off
        tapPos.y += tileWidth / 2;
        tapPos = getTileCoordinates(tapPos, tileWidth);
        if (tapPos.x > -1 && tapPos.y > -1 && tapPos.x < 7 && tapPos.y < 7) { //tapped within grid
            if (levelData[tapPos.y][tapPos.x] != 1) { //not wall tile
                isFindingPath = true;
                //let the algorithm do the magic
                easystar.findPath(heroMapTile.x, heroMapTile.y, tapPos.x, tapPos.y, plotAndMove);
                easystar.calculate();
            }
        }


    }
    init_mouse() {
        this.input.on('pointerdown', (...args) => this.find_path(...args), this);
        //this.input.activePointer.leftButton.onUp.add(this.findPath)
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
        this.players.push(this.add.existing(new this.skeleton(this, 240, 290, 'walk', 'southEast', 1000)));
        return this
    }

    create(data) {
        this.init_skeleton().make_map().add_player().init_cursor().init_mouse()
        this.cameras.main.setZoom(1.2);




    }

    update(time, delta) {
        this.controls.update(delta)
        this.players.forEach((player) => {
            player.update()
        });
    }
}