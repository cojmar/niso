export default class extends Phaser.Scene {
    constructor(config) {
        super(config)
    }
    preload() {
        this.load.setBaseURL('./assets/images');
        this.load.image('tiles', 'isometric-grass-and-water.png');
        this.load.tilemapTiledJSON('map', 'isometric-grass-and-water.json');
        this.load.spritesheet('skeleton', 'skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    }
    init() {
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

    bind_controls() {
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

        this.input.on('pointerdown', () => {
            this.pointer_down = true
            if (!this.me) return
            this.me.set({
                action: 'attack'
            })
        });

        this.input.on('pointerup', () => {
            this.pointer_down = false
        });

        this.input.on('pointermove', (pointer) => {
            var angle = Phaser.Math.Angle.Between(this.me.sprite.x, this.me.sprite.y, pointer.worldX, pointer.worldY);
            var angleSnap = Phaser.Math.Snap.To(angle, SNAP_INTERVAL);
            var angleSnapDeg = Phaser.Math.RadToDeg(angleSnap);
            var angleSnapDir = directions[angleSnapDeg];
            if (this.me.direction !== angleSnapDir) {
                this.me.set({ direction: angleSnapDir, action: (!this.pointer_down) ? 'walk' : 'attack', x: this.me.sprite.x, y: this.me.sprite.y })
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
            { name: 'die', startFrame: 20, endFrame: 27 },
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
    update_player(player_id) {
        let player = this.get_player(player_id)
        if (!player) return false
            // If new data
        if (player.input_data) {
            ['x', 'y'].map(cord => {
                if (typeof player.input_data[cord] !== 'undefined') player.sprite[cord] = player.input_data[cord]
            });
            ['direction', 'speed', 'action'].map(prop => {
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
    set_player(player_id, input_data) {
        if (!player_id) return false
        let player = this.get_player(player_id)
        if (!player) {
            player = {
                id: player_id,
                x: 0,
                y: 0,
                direction: 's',
                action: 'attack',
                speed: 0.12,
                sprite: this.add.sprite(0, 0, 'skeleton'),
                animation: '',
                update: () => this.update_player(player_id),
                set: (input_data) => {
                    if (typeof input_data === 'object') player.input_data = (typeof player.input_data === 'object') ? Object.assign(player.input_data, input_data) : input_data
                    return player
                }
            }

            player.sprite.on('animationcomplete', (anim, frame) => {
                let action = anim.key.split('-')[0]
                if (action === 'attack') {
                    if (this.me && this.pointer_down) {
                        if (this.me.id === player.id) {

                            this.me.sprite.play(player.animation, 0)
                            player.set({ 'action': 'attack' })
                        } else player.set({ 'action': 'idle' })
                    } else player.set({ 'action': 'idle' })
                }
            });
            this.players.push(player)
        }

        if (typeof input_data === 'object') player.input_data = (typeof player.input_data === 'object') ? Object.assign(player.input_data, input_data) : input_data
        return player
    }
    create() {
        this.bind_controls().make_animations().make_map().render_room_users()
        this.cameras.main.setZoom(1.8);
        this.me = this.get_player(this.game.net.me.info.user)
        this.me.set({
            x: 600,
            y: 300,
            action: 'idle'
        })
        this.cameras.main.startFollow(this.me.sprite)
        this.update_me_interval = setInterval(() => {
            this.game.net.send_cmd('set_data', {
                x: this.me.sprite.x,
                y: this.me.sprite.y,
                direction: this.me.direction,
                action: this.me.action
            })
        }, 10000)
    }
    render_room_users() {
        let i = 200;
        Object.keys(this.game.net.room.users).map(id => {
            let user = this.game.net.room.users[id]
            i += 300
            this.set_player(id, { x: i, y: 200 }).set(user.data)
        })
    }


    update(delta) {
        this.players.map(player => player.update(delta))
    }
}