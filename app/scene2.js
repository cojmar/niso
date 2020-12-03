export default class  extends Phaser.Scene {

    constructor (config)
    {
        super(config);
    }

    preload ()
    {
        //this.load.image('red', 'assets/particles/red.png');
    }

    create (data)
    {
        this.add.image(400, 300, 'sky');
        var particles = this.add.particles('red');
        var emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD'
        });
        var logo = this.physics.add.image(400, 100, 'logo');
        logo.setVelocity(10, 200);
        logo.setBounce(1, 1);
        logo.setCollideWorldBounds(true);
        emitter.startFollow(logo);
        this.game.scene.bringToTop('scene1')
        this.game.load_scene('menu')
    }

}