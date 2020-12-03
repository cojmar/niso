new class {
    constructor() {
        this.init_game().extend_game().hide_loader().main()
        window.app = this;
    }
    init_game(){
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
    hide_loader(){
        document.getElementById('loader').style.display = 'none'
        return this
    }
    //==Extend game methods
    game_load_scene(name,autoStart=true,data){
        if (this.game.scene.getScene(name) !== null){
            this.game.scene.resume(name)
            this.game.scene.bringToTop(name)
            return
        }
        import (`./${name}.js`).then((module)=>{
           this.game.scene.add(name, module.default, autoStart,data);
        })
    }
    extend_game(){
        let prefix = 'game_'
        Object.getOwnPropertyNames(Object.getPrototypeOf(this)).map((method)=>{
            if (method.lastIndexOf(prefix) ===0) this.game[method.replace(prefix,'')] = (...args)=> {
                this[method](...args)
            }
        })
        return this
    }
    main(){
        this.game.load_scene('preload')
    }
}