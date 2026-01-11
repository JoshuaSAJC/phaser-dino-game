import { Scene } from 'phaser';

const WIDTH = 1024;
const HEIGHT = 768;

export class Game extends Scene {
    constructor() {
        super('Game');
        this.player = null;

        let player;
        let ground;
        let clouds;
    }

    preload() {
        // load assets
        this.load.spritesheet("dino","assets/dino-run.png", {frameWidth: 88, frameHeight: 94});
        this.load.image("ground", "assets/ground.png");
        this.load.image("cloud", "assets/cloud.png");

        // load cactuses (different type)
        for (let i=0; i<6; i++) {
            const cactusNum = i+1;
            // console.log(`cactus${cactusNum}`)
            this.load.image(`obstacle-${cactusNum}`, `assets/cactuses_${cactusNum}.png`);
        }

        // preload the game over text and restart button
        this.load.image("game-over", "assets/game-over.png");
        this.load.image("restart", "assets/restart.png");

        //loud sound assests
        this.load.audio("jump","assets/jump.m4a");
        this.load.audio("hit", "assets/hit.m4a");
    }

    create() {
        // initialize game
        this.player = this.physics.add.sprite(200, 200, "dino").setDepth(1).setOrigin(0).setGravityY(5000).setCollideWorldBounds(true).setBodySize(44,92);
        this.ground = this.add.tileSprite(0, 400, 1000, 30, "ground").setOrigin(0);

        // add ground collider
        this.groundCollider = this.physics.add.staticSprite(0,425, "ground").setOrigin(0);
        this.groundCollider.body.setSize(1000, 30);
        this.groundCollider.setVisible(false);  // hide the static ground 

        this.physics.add.collider(this.player, this.groundCollider);

        this.clouds = this.add.group()
        this.clouds = this.clouds.addMultiple([
            this.add.image(300, 100, "cloud"),
            this.add.image(400, 120, "cloud"),
            this.add.image(550, 70, "cloud"),
            this.add.image(150, 70, "cloud"),
        ])

        this.gameSpeed = 5;

        this.obstacles = this.physics.add.group({
            allowGravity: false, //no gravity for cactuses
        })

        this.timer = 0; //timer for the game

        // create cursor obj
        this.cursors = this.input.keyboard.createCursorKeys();

        // add collider for player and obstacle
        this.physics.add.collider(this.obstacles, this.player, this.gameOver, null, this);
        this.isGameRunning = true;

        this.gameOverText = this.add.image(0,0, "game-over");
        this.restartButton = this.add.image(0, 80, "restart").setInteractive();

        this.gameOverContainer = this.add
        .container(900/2, (300/2)-50)
        .add([this.gameOverText, this.restartButton])
        .setAlpha(0);   //hide container

        // add score text
        this.scoreText = this.add.text(700, 50, "00000", {
            fontSize: 30,
            fontFamily: "Arial",
            color: "#535353",
            resolution: 5
        }).setOrigin(1,0);

        this.score = 0;
        this.frameCounter = 0;  //keep track frame passed
    }

    update(time, delta) {

        // if isGameRunning = false, then exit the game
        // if not isGameRunning -> if not false -> if true
        if (!this.isGameRunning) {return;};

        // this extract the space and up key and assign to variables
        const {space, up} = this.cursors;
        //if (spacebar is pressed OR up arrow key is pressed) AND dino is on the ground
        if ((Phaser.Input.Keyboard.JustDown(space) || Phaser.Input.Keyboard.JustDown(up))
            && this.player.body.onFloor()){
            this.player.setVelocityY(-1600);    //make dino jump
            this.sound.play("jump");
        }

        // To add cactus every second
        this.timer += delta;    //delta is in miliseconds
        if (this.timer > 1000) {    //1000ms = 1 sec
            //generate a number in range 1~6
            this.obstacleNum = Math.floor(Math.random() * 6) +1;
            this.obstacles.create(750,340, `obstacle-${this.obstacleNum}`).setOrigin(0);
            this.timer -= 1000; //reset timer
        }

        // to move cactus towards dino
        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);

        //to destroy and remove the cactus when out of screen
        this.obstacles.getChildren().forEach(obstacle => {
            if(obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle);
                obstacle.destroy();
            }
        })

        // game logic
        this.ground.tilePositionX += this.gameSpeed;

        // add logic of restart
        this.restartButton.on("pointerdown", () => {
            this.physics.resume();
            this.player.setVelocityY(0);
            this.obstacles.clear(true,true);
            this.gameOverContainer.setAlpha(0);
            this.isGameRunning = true;
            this.frameCounter = 0;
            this.score = 0;
            const formattedScore = String(Math.floor(this.score)).padStart(5,"0");
            this.scoreText.setText(formattedScore);
        })

        // add 1 to frameCounter in every single frame
        this.frameCounter++;

        // if frameCounter more than 100
        if (this.frameCounter > 100) {
            this.score += 100;  // award 100 points to player
            const formattedScore = String(Math.floor(this.score));
            this.scoreText.setText(formattedScore);
            this.frameCounter -= 100;   // reset the frame counter
        }

        this.anims.create({
            key: "dino-run",
            frames: this.anims.generateFrameNames("dino", {start:2, end:3}),
            frameRate: 10,
            repeat: -1
        });

        this.player.play("dino-run", true);
        
    }

    gameOver() {
        this.physics.pause();
        this.timer = 0;
        this.isGameRunning = false;
        this.gameOverContainer.setAlpha(1); //show game over container
        this.sound.play("hit");
    }

}