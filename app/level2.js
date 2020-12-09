export default class extends Phaser.Scene {
    constructor(config) {
        super(config)
    }

    preload() {
        this.load.crossOrigin = 'Anonymous';
        this.load.bitmapFont('font', 'https://dl.dropboxusercontent.com/s/z4riz6hymsiimam/font.png?dl=0', 'https://dl.dropboxusercontent.com/s/7caqsovjw5xelp0/font.xml?dl=0');
        this.load.image('greenTile', 'https://dl.dropboxusercontent.com/s/nxs4ptbuhrgzptx/green_tile.png?dl=0');
        this.load.image('redTile', 'https://dl.dropboxusercontent.com/s/zhk68fq5z0c70db/red_tile.png?dl=0');
        this.load.image('heroTile', 'https://dl.dropboxusercontent.com/s/8b5zkz9nhhx3a2i/hero_tile.png?dl=0');
        this.load.image('heroShadow', 'https://dl.dropboxusercontent.com/s/sq6deec9ddm2635/ball_shadow.png?dl=0');
        this.load.image('floor', 'https://dl.dropboxusercontent.com/s/h5n5usz8ejjlcxk/floor.png?dl=0');
        this.load.image('wall', 'https://dl.dropboxusercontent.com/s/uhugfdq1xcwbm91/block.png?dl=0');
        this.load.image('ball', 'https://dl.dropboxusercontent.com/s/pf574jtx7tlmkj6/ball.png?dl=0');
        this.load.atlas({
            key: 'hero',
            textureURL: 'https://dl.dropboxusercontent.com/s/hradzhl7mok1q25/hero_8_4_41_62.png?dl=0',
            atlasURL: 'https://dl.dropboxusercontent.com/s/95vb0e8zscc4k54/hero_8_4_41_62.json?dl=0'
        });
    }

    init_mouse() {
        this.input.on('pointerdown', (...args) => this.find_path(...args), this)
        return this
    }
    make_map() {

        return this
    }

    find_path() {
        let pos = this.input.activePointer.position
        let isoPt = new Phaser.Geom.Point(pos.x - this.borderOffset.x, pos.y - this.borderOffset.y);
        console.log(isoPt)
        return pos
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
    create(data) {
        this.levelData = [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ];

        this.dX = 0;
        this.dY = 0;
        this.tileWidth = 50; // the width of a tile
        this.borderOffset = new Phaser.Geom.Point(250, 50); //to centralise the isometric level display
        this.wallGraphicHeight = 98;
        this.floorGraphicWidth = 103;
        this.floorGraphicHeight = 53;
        this.heroGraphicWidth = 41;
        this.heroGraphicHeight = 62;
        this.wallHeight = this.wallGraphicHeight - this.floorGraphicHeight;
        this.heroHeight = (this.floorGraphicHeight / 2) + (this.heroGraphicHeight - this.floorGraphicHeight) + 6; //adjustments to make the legs hit the middle of the tile for initial load
        this.heroWidth = (this.floorGraphicWidth / 2) - (this.heroGraphicWidth / 2); //for placing hero at the middle of the tile
        this.facing = 'south'; //direction the character faces
        this.sorcerer; //hero
        this.sorcererShadow; //duh
        this.shadowOffset = new Phaser.Geom.Point(this.heroWidth + 7, 11);
        this.bmpText; //title text
        this.normText; //text to display hero coordinates
        this.minimap; //minimap holder group
        this.heroMapSprite; //hero marker sprite in the minimap
        this.gameScene; //this is the render texture onto which we draw depth sorted scene
        this.floorSprite;
        this.wallSprite;
        this.heroMapTile = new Phaser.Geom.Point(1, 1); //hero tile values in array
        this.heroMapPos; //2D coordinates of hero map marker sprite in minimap, assume this is mid point of graphic
        this.heroSpeed = 1.2; //well, speed of our hero
        this.tapPos = new Phaser.Geom.Point(0, 0);
        this.easystar;
        this.isFindingPath = false;
        this.path = [];
        this.destination = this.heroMapTile;
        this.stepsTillTurn = 19; //20 works best but thats for full frame rate
        this.stepsTaken = 0;
        this.isWalking;
        this.halfSpeed = 0.8; //changed from 0.5 for smooth diagonal walks



        this.bmpText = this.add.bitmapText(10, 10, 'font', 'PathFinding\nTap Green Tile', 18)
        this.normText = this.add.text(10, 360, "hi")
        this.cameras.main.setBackgroundColor('#cccccc')

        //we draw the depth sorted scene into this render texture
        this.gameScene = this.add.renderTexture(this.cameras.main.width, this.cameras.main.height);
        this.add.sprite(0, 0, this.gameScene);

        this.floorSprite = this.add.sprite(0, 0, 'floor');
        this.wallSprite = this.add.sprite(0, 0, 'wall');
        this.sorcererShadow = this.add.sprite(0, 0, 'heroShadow');

        this.sorcererShadow.scale = Phaser.Geom.Point(0.5, 0.6);
        this.sorcererShadow.alpha = 0.4;
        this.isWalking = false;
        this.createLevel()

        let easystar = new EasyStar.js();
        easystar.setGrid(this.levelData);
        easystar.setAcceptableTiles([0]);
        easystar.enableDiagonals(); // we want path to have diagonals
        easystar.disableCornerCutting(); // no diagonal path when walking at wall corners
        this.init_mouse()

    }
    placeTile(tileType, i, j) {

        let tile = 'greenTile';
        if (tileType == 1) {
            tile = 'redTile';
        }
        let tmpSpr = this.minimap.create(j * this.tileWidth, i * this.tileWidth, tile);
        tmpSpr.name = "tile" + i + "_" + j;

    }
    getTileCoordinates(cartPt, tileHeight) {
        let tempPt = new Phaser.Geom.Point();
        tempPt.x = Math.floor(cartPt.x / this.tileHeight);
        tempPt.y = Math.floor(cartPt.y / this.tileHeight);
        return (tempPt);
    }
    createLevel() {
        this.minimap = this.add.group();
        let tileType = 0;
        for (var i = 0; i < this.levelData.length; i++) {
            for (var j = 0; j < this.levelData[0].length; j++) {
                tileType = this.levelData[i][j];
                this.placeTile(tileType, i, j);
                if (tileType == 2) { //save hero map tile
                    this.heroMapTile = new Phaser.Point(i, j);
                }
            }
        }

        this.createAnimations()
        this.sorcerer = this.addHero()
            //this.sorcerer2 = this.addHero(250, 150)
            //this.sorcerer.play('south')
            //this.sorcerer2.play('north')

        this.heroMapSprite = this.minimap.create(this.heroMapTile.y * this.tileWidth, this.heroMapTile.x * this.tileWidth, 'heroTile');
        this.heroMapSprite.x += (this.tileWidth / 2) - (this.heroMapSprite.width / 2);
        this.heroMapSprite.y += (this.tileWidth / 2) - (this.heroMapSprite.height / 2);

        this.heroMapPos = new Phaser.Geom.Point(this.heroMapSprite.x + this.heroMapSprite.width / 2, this.heroMapSprite.y + this.heroMapSprite.height / 2);
        this.heroMapTile = this.getTileCoordinates(this.heroMapPos, this.tileWidth);
        //this.minimap.scale = new Phaser.Geom.Point(0.3, 0.3);
        //this.minimap.scaleXY(0.3, 0.3)
        //this.minimap.setXY(500, 10);

        this.renderScene();
    }
    createAnimations() {
        [
            ['southeast', ['1.png', '2.png', '3.png', '4.png']],
            ['south', ['5.png', '6.png', '7.png', '8.png']],
            ['southwest', ['9.png', '10.png', '11.png', '12.png']],
            ['west', ['13.png', '14.png', '15.png', '16.png']],
            ['northwest', ['17.png', '18.png', '19.png', '20.png']],
            ['north', ['21.png', '22.png', '23.png', '24.png']],
            ['northeast', ['25.png', '26.png', '27.png', '28.png']],
            ['east', ['29.png', '30.png', '31.png', '32.png']],

        ].map(e => {
            this.anims.create({
                key: e[0],
                frames: this.anims.generateFrameNames('hero', { frames: e[1] }),
                frameRate: 6,
                repeat: -1
            });
        })
    }
    addHero(x = 0, y = 0) {
        let hero = this.add.sprite(x, y, 'hero')
        return hero

    }
    renderScene() {
        this.gameScene.clear(); //clear the previous frame then draw again
        var tileType = 0;
        for (var i = 0; i < this.levelData.length; i++) {
            for (var j = 0; j < this.levelData[0].length; j++) {
                tileType = this.levelData[i][j];
                this.drawTileIso(tileType, i, j);
                if (i == this.heroMapTile.y && j == this.heroMapTile.x) {
                    this.drawHeroIso();
                }
            }
        }
        this.normText.text = 'Tap on x,y: ' + this.tapPos.x + ',' + this.tapPos.y;
    }
    drawTileIso(tileType, i, j) {
        let isoPt = new Phaser.Geom.Point(); //It is not advisable to create point in update loop
        var cartPt = new Phaser.Geom.Point(); //This is here for better code readability.
        cartPt.x = j * this.tileWidth;
        cartPt.y = i * this.tileWidth;
        isoPt = this.cartesianToIsometric(cartPt);
        if (tileType == 1) {
            this.gameScene.draw(this.wallSprite, isoPt.x + this.borderOffset.x, isoPt.y + this.borderOffset.y - this.wallHeight);
        } else {
            this.gameScene.draw(this.floorSprite, isoPt.x + this.borderOffset.x, isoPt.y + this.borderOffset.y);
        }
    }
    drawHeroIso() {
        console.log('wtf')
        let isoPt = new Phaser.Geom.Point(); //It is not advisable to create points in update loop
        let heroCornerPt = new Phaser.Geom.Point(this.heroMapPos.x - this.heroMapSprite.width / 2, this.heroMapPos.y - this.heroMapSprite.height / 2);
        isoPt = this.cartesianToIsometric(heroCornerPt); //find new isometric position for hero from 2D map position
        this.gameScene.renderXY(this.sorcererShadow, isoPt.x + this.borderOffset.x + this.shadowOffset.x, isoPt.y + this.borderOffset.y + this.shadowOffset.y, false); //draw shadow to render texture
        this.gameScene.renderXY(this.sorcerer, isoPt.x + this.borderOffset.x + this.heroWidth, isoPt.y + this.borderOffset.y - this.heroHeight, false); //draw hero to render texture

    }
    cartesianToIsometric(cartPt) {
        let tempPt = new Phaser.Geom.Point();
        tempPt.x = cartPt.x - cartPt.y;
        tempPt.y = (cartPt.x + cartPt.y) / 2;
        return (tempPt);
    }
    update(time, delta) {

    }
}