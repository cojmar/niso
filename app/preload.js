export default class  extends Phaser.Scene {
    constructor (config)
    {
        super(config);
    }
    preload ()
    {
        this.load.setBaseURL('//labs.phaser.io');
        this.load.image('sky', 'assets/skies/space3.png');
        this.load.image('logo', 'assets/sprites/phaser3-logo.png');
        this.load.image('red', 'assets/particles/red.png');
    }
    create (data)
    {
        this.game.load_scene('scene1')
    }
}