export default class extends Phaser.Scene {

    constructor(config) {
        super(config);
        this.buttons = []
        this.button_coords = [140, 30]
    }

    preload() {

    }
    set_active_button(index){
        if(!index) index = 0;
        this.active_button = index;
        let button = this.buttons[index];
        this.buttons.forEach((menu_but)=>{
            menu_but.setColor('#395fa4');
        });
        if (button) button.setColor('#fff');
    }

    add_button(label, action) {
        let button = this.add.text(...this.button_coords, label, {
            fontFamily: '"Roboto Condensed"',
            fontSize: "30px",
            color: "#395fa4"
        });
        button.id = this.buttons.length
        button.setInteractive({ useHandCursor: true });
        button.on("pointerup", () => {
            if (typeof action ==='function') action()
        });
        button.on("pointerover", () => {
            this.set_active_button(button.id);
        });
        button.on("pointerout", () => {
            this.set_active_button(-1);
        });
        this.buttons.push(button)
        this.button_coords[1] += 40
    }

    create(data) {

        this.add_button('Menu Item 1')
        this.add_button('Menu Item 2',()=>{
            console.log('click on menu item 2')
        })

    }

}