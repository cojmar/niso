export default class  extends Phaser.Scene {

    constructor (config)
    {
        super(config);
    }

    preload ()
    {

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
        logo.setVelocity(100, 200);
        logo.setBounce(1, 1);
        logo.setCollideWorldBounds(true);
        emitter.startFollow(logo);
        this.game.load_scene('scene2')
    }

}