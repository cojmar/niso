export default class extends Phaser.Scene {
    constructor(config) {
        super(config);
    }
    preload() {

    }
    create(data) {
        this.game.add_scene('game')
    }
}