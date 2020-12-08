new class {
    constructor() {
        this.preloaded_scenes = []
        this.init_game().extend_game().hide_loader().main()
        window.app = this
    }
    init_game() {
        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            width: '100%',
            height: '100%',
            physics: {
                default: 'arcade',
            }
        });
        return this
    }
    hide_loader() {
        document.getElementById('loader').style.display = 'none'
        return this
    }

    //==Extend game methods
    game_add_scene(name, cb) {
        if (this.preloaded_scenes.indexOf(name) !== -1) return
        this.preloaded_scenes.push(name)

        import (`./${name}.js`).then((module) => {
            let ret = this.game.scene.add(name, module.default, true)
            if (typeof cb === 'function') cb(ret)
        })
    }
    extend_game() {
        let prefix = 'game_'
        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).map((method) => {
            if (method.lastIndexOf(prefix) === 0) this.game[method.replace(prefix, '')] = (...args) => this[method](...args)
        })
        return this
    }
    main() {
        this.game.add_scene('preload', scene => {
            //console.log(scene)
        })
    }
}