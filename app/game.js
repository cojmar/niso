export default class extends Phaser.Scene {
    constructor(config) {
        super(config)
    }
    preload() {
        this.load.setBaseURL('./assets/resources');
        this.load.image('tiles', 'isometric-grass-and-water.png');
        this.load.tilemapTiledJSON('map', 'isometric-grass-and-water.json');
        this.load.spritesheet('skeleton', 'skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    }
    init() {
        this.last_delta = 0
        this.players = []
        this.directions = {
            'w': { offset: 0, x: -2, y: 0, opposite: 'e' },
            'nw': { offset: 32, x: -2, y: -1, opposite: 'se' },
            'n': { offset: 64, x: 0, y: -2, opposite: 's' },
            'ne': { offset: 96, x: 2, y: -1, opposite: 'sw' },
            'e': { offset: 128, x: 2, y: 0, opposite: 'w' },
            'se': { offset: 160, x: 2, y: 1, opposite: 'nw' },
            's': { offset: 192, x: 0, y: 2, opposite: 'n' },
            'sw': { offset: 224, x: -2, y: 1, opposite: 'ne' }
        }
        this.game.net.on('room.user_leave', (data) => this.remove_player(data.user))
        this.game.net.on('room.user_data', (data) => {
            if (!this.me) return
            if (data.user !== this.me.id) {
                this.set_player(data.user, data.data)
            }
        })
        return this
    }

    find_direction_between_points(x1, y1, x2, y2) {
        let SNAP_INTERVAL = Phaser.Math.PI2 / 8;
        let directions = {
            '-180': 'w',
            '-135': 'nw',
            '-90': 'n',
            '-45': 'ne',
            '0': 'e',
            '45': 'se',
            '90': 's',
            '135': 'sw',
            '180': 'w'
        };
        let angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
        let angleSnap = Phaser.Math.Snap.To(angle, SNAP_INTERVAL);
        let angleSnapDeg = Phaser.Math.RadToDeg(angleSnap);
        return directions[angleSnapDeg];
    }
    bind_controls() {

        this.input.on('pointerdown', () => {
            this.pointer_down = true
            if (!this.me) return
            if (this.me.action === 'die') return false
            this.me.set({
                action: 'attack'
            })
        });

        this.input.on('pointerup', () => {
            this.pointer_down = false
        });

        this.input.on('pointermove', (pointer) => {
            if (this.me.action === 'die') return false
            let angle_direction = this.find_direction_between_points(this.me.sprite.x, this.me.sprite.y, pointer.worldX, pointer.worldY)
            if (this.me.direction !== angle_direction || this.me.action === 'idle') {
                this.me.set({ direction: angle_direction, action: (!this.pointer_down) ? 'walk' : 'attack', x: this.me.sprite.x, y: this.me.sprite.y })
            }
        });


        return this
    }
    make_map() {
        this.map = this.make.tilemap({ key: 'map' })
        let tiles = this.map.addTilesetImage('isometric_grass_and_water', 'tiles');
        this.map.createLayer(0, tiles, this.map.widthInPixels / 2, 0);
        return this
    }
    make_animations() {
        [{ name: 'idle', startFrame: 0, endFrame: 4 },
            { name: 'walk', startFrame: 4, endFrame: 11 },
            { name: 'attack', startFrame: 12, endFrame: 19, repeat: 0, frameRate: 15 },
            { name: 'die', startFrame: 20, endFrame: 27, repeat: 0 },
            { name: 'shoot', startFrame: 28, endFrame: 32 }
        ].map(ani => {
            Object.keys(this.directions).map(dir => {
                this.anims.create({
                    key: `${ani.name}-${dir}`,
                    frames: this.anims.generateFrameNumbers('skeleton', { start: ani.startFrame + this.directions[dir].offset + 1, end: ani.endFrame + this.directions[dir].offset - 1 }),
                    frameRate: (typeof ani.frameRate !== 'undefined') ? ani.frameRate : 6,
                    repeat: (typeof ani.repeat !== 'undefined') ? ani.repeat : -1
                });
            })
        })
        return this
    }
    get_player(player_id) {
        let ret = false;
        this.players.map(player => {
            if (player.id === player_id) ret = player
        })
        return ret || false
    }
    remove_player(player_id) {
        let player = this.get_player(player_id)
        let player_key = false
        if (!player) return false
        this.players.map((p, key) => {
            if (p.id === player_id) player_key = key
        })
        if (player_key === false) return false
        this.players.splice(player_key, 1)
        try {
            player.sprite.destroy()
        } catch (error) {

        }
    }
    update_player(player_id) {
        let player = this.get_player(player_id)
        if (!player) return false
            // If new data
        if (player.input_data) {
            ['x', 'y'].map(cord => {
                if (typeof player.input_data[cord] !== 'undefined') player.sprite[cord] = player.input_data[cord]
            });
            ['direction', 'speed', 'action', 'hp', 'attack', 'last_attack', 'kills', 'deaths'].map(prop => {
                if (typeof player.input_data[prop] !== 'undefined') {
                    player[prop] = player.input_data[prop]
                }
            });
            if (this.me.id === player_id) {
                this.game.net.send_cmd('set_data', player.input_data)
            }
            player.input_data = false
        }
        // Calculate player
        if (player.action === 'walk') {
            ['x', 'y'].map(cord => {
                player.sprite[cord] += this.directions[player.direction][cord] * player.speed
            })
        }

        if (player.animation !== `${player.action}-${player.direction}`) {
            player.animation = `${player.action}-${player.direction}`
            player.sprite.play(player.animation, 0)
        }
    }
    set_player(player_id, input_data) {
        if (!player_id) return false
        let player = this.get_player(player_id)
        if (!player) {
            player = {
                id: player_id,
                x: 0,
                y: 0,
                direction: 's',
                action: 'idle',
                speed: 0.12,
                hp: 100,
                attack: [5, 20],
                last_attack: 0,
                kills: 0,
                deaths: 0,
                sprite: this.physics.add.sprite(0, 0, 'skeleton'),
                animation: '',
                update: () => this.update_player(player_id),
                set: (input_data) => {
                    if (typeof input_data === 'object') player.input_data = (typeof player.input_data === 'object') ? Object.assign(player.input_data, input_data) : input_data
                    return player
                }
            }
            player.sprite.player_id = player_id
            player.sprite.on('animationcomplete', (anim, frame) => {
                let action = anim.key.split('-')[0]
                    // Attack
                if (action === 'attack') {
                    player.sprite.play(player.animation)
                    if (this.me && !this.pointer_down) {
                        if (this.me.id === player.id) {
                            player.set({ 'action': 'idle' })
                        }
                    }
                }

                // Die
                if (action === 'die') {
                    this.reset_player(player.id)
                }

            });

            player.sprite.setSize(70, 40, true)
            this.players.map(pl => {
                this.physics.add.collider(pl.sprite, player.sprite, this.player_collision, null, this);
            })
            this.players.push(player)
        }

        if (typeof input_data === 'object') player.input_data = (typeof player.input_data === 'object') ? Object.assign(player.input_data, input_data) : input_data
        return player
    }
    random_from_interval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    player_collision(p1, p2, delta) {
        let player1 = this.get_player(p1.player_id)
        let player2 = this.get_player(p2.player_id)
        if (player1.action === 'die' || player2.action === 'die') return false

        // Attack
        if (player1.action === 'attack' || player2.action === 'attack') {
            // Calculate player direction and and action are ok for attack
            let dir_p2 = this.find_direction_between_points(p1.x, p1.y, p2.x, p2.y)
            let dir_p1 = this.directions[dir_p2].opposite
            let p1_can_hit = dir_p2 === player1.direction
            let p2_can_hit = dir_p1 === player2.direction
            if (player1.action !== 'attack') p1_can_hit = false
            if (player2.action !== 'attack') p2_can_hit = false

            // If animation not on frame 3 don't consider hit
            if (p1.anims.currentFrame.index !== 3) p1_can_hit = false
            if (p2.anims.currentFrame.index !== 3) p2_can_hit = false

            // If both player can hit pick one random to do
            if (p1_can_hit && p2_can_hit) {
                p2_can_hit = false

                /*
                if (this.random_from_interval(1, 2) == 2) p2_can_hit = false
                else p1_can_hit = false
                */
            }

            if (p1_can_hit || p2_can_hit) {
                let attacker = (p1_can_hit) ? player1 : player2
                let defender = (p1_can_hit) ? player2 : player1
                let dmg = attacker.attack[0] // randomize in prog
                let hp = defender.hp - dmg
                let a_data = {
                    'last_attack': dmg
                }
                let d_data = {
                    'hp': hp
                }

                if (hp < 0) {
                    a_data['kills'] = attacker.kills + 1
                    d_data['deaths'] = defender.deaths + 1
                    d_data['action'] = 'die'
                }
                attacker.set(a_data);
                defender.set(d_data);

                //console.log(defender)
            }
        }


    }
    reset_player(player_id) {
        let player = this.get_player(player_id)
        if (!player) return false
        player.set({
            x: this.random_from_interval(300, 900),
            y: this.random_from_interval(200, 600),
            hp: 100,
            dmg: [5, 20],
            action: 'idle'
        })

    }
    create() {
        this.bind_controls().make_animations().make_map().render_room_users()
        this.cameras.main.setZoom(1.8);
        this.me = this.get_player(this.game.net.me.info.user)
        this.cameras.main.startFollow(this.me.sprite)


        //=Update my position every 10
        this.update_me_interval = setInterval(() => {
            this.game.net.send_cmd('set_data', {
                x: this.me.sprite.x,
                y: this.me.sprite.y,
                direction: this.me.direction,
                action: this.me.action
            })
        }, 10000)

        //=Reset me
        setTimeout(() => {
            this.reset_player(this.me.id)
            this.make_gui_data().make_gui()
        });
    }
    render_room_users() {
        let i = 200;
        Object.keys(this.game.net.room.users).map(id => {
            let user = this.game.net.room.users[id]
            i += 300
            this.set_player(id, { x: i, y: 200 }).set(user.data)
        })
        return this
    }


    update(delta) {
        this.players.map(player => player.update(delta))
        this.make_gui_data(delta)
        if (this.gui) this.gui.refresh()
    }
    make_gui_data(delta) {
        let gui_data = {
            X: (this.me) ? Math.floor(this.me.sprite.x) : 0,
            Y: (this.me) ? Math.floor(this.me.sprite.y) : 0,
            Action: (this.me) ? this.me.action : '',
            Direction: (this.me) ? this.me.direction : '',
            HEALTH: (this.me) ? this.me.hp : '',
            'MIN DMG': (this.me) ? this.me.attack[0] : '',
            'MAX DMG': (this.me) ? this.me.attack[1] : '',
            'LAST ATTACK': (this.me) ? this.me.last_attack : '',
            KILLS: (this.me) ? Math.floor(this.me.kills) : '',
            DEATHS: (this.me) ? Math.floor(this.me.deaths) : '',
            'MOVE SPEED': (this.me) ? this.me.speed : '',
        }
        gui_data['POSITION'] = `X:${gui_data['X']} Y:${gui_data['Y']}`
        if (!this.gui_data) this.gui_data = gui_data
        else Object.keys(gui_data).map(k => this.gui_data[k] = gui_data[k])


        if (this.gui && (delta - this.last_delta > 3000)) {
            this.last_delta = delta
            if (this.gui.top_players) {
                this.gui.top_players.dispose()
            }
            this.gui.top_players = this.gui.addFolder({
                title: `Top`,
                expanded: true
            })

            let top = Object.keys(this.game.net.room.users).map(user => {
                return {
                    user: user,
                    nick: this.game.net.room.users[user].info.nick,
                    kills: this.game.net.room.users[user].data.kills || 0,
                    deaths: this.game.net.room.users[user].data.deaths || 0
                }
            })

            top.sort((a, b) => (a.kills < b.kills) ? 1 : -1)
            top.map((player, rank) => {
                if (player.user === this.me.id) this.gui.top_players.addSeparator();
                this.gui.top_players.addButton({ title: `${rank+1} ${player.nick} K:${player.kills} D:${player.deaths}` });
                if (player.user === this.me.id) this.gui.top_players.addSeparator();
            })

        }

        return this
    }
    make_gui() {
        this.gui = new Tweakpane()
        const pane = this.gui.addFolder({
            title: `Player: ${this.game.net.me.info.nick}`,
            expanded: false
        })
        const pane2 = this.gui.addFolder({
            title: `Stats`,
            expanded: true
        })
        const pane3 = this.gui.addFolder({
            title: `PvP`,
            expanded: true
        })
        pane.addInput(this.gui_data, 'Action');
        pane.addInput(this.gui_data, 'Direction');
        pane.addInput(this.gui_data, 'POSITION');
        pane2.addInput(this.gui_data, 'HEALTH', {
            min: 0,
            max: 100,
        });
        pane2.addInput(this.gui_data, 'MOVE SPEED');
        pane2.addInput(this.gui_data, 'MIN DMG', { step: 1 });
        pane2.addInput(this.gui_data, 'MAX DMG', { step: 1 });
        pane2.addInput(this.gui_data, 'LAST ATTACK', { step: 1 });
        pane3.addInput(this.gui_data, 'KILLS', { step: 1 });
        pane3.addInput(this.gui_data, 'DEATHS', { step: 1 });
        return this
    }
}