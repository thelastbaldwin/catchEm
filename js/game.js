var myGame = {};

myGame.NUM_PRESENTS = 12;
myGame.MAX_SPEED = 150;
myGame.GOLDEN_RATIO = 1.618;
myGame.BASE_WIDTH = 400;
myGame.BASE_HEIGHT = myGame.BASE_WIDTH/myGame.GOLDEN_RATIO;

myGame.loading = function(game){};
myGame.loading.prototype = {
	preload: function(){
		game.load.image('background', 'img/background.png');
		game.load.image('red_gift', 'img/present_1.png');
		game.load.image('purple_gift', 'img/present_2.png');
		game.load.image('blue_gift', 'img/present_3.png');
		game.load.image('ground', 'img/ground.png');
		game.load.spritesheet('dude', 'img/dude.png', 32, 48);
		game.load.image('start_button', 'img/play_button.png');

		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.maxWidth = myGame.BASE_WIDTH * 2;
		game.scale.maxHeight = game.scale.maxWidth/myGame.GOLDEN_RATIO;
		game.scale.setScreenSize(true);
	},
	create: function(){
		// x, y, spriteSheet, callback, callbackContext, overFrame, outFrame, downFrame
		this.startButton = this.add.button(game.world.centerX,game.world.centerY, 'start_button', this.startGame, this);
		this.startButton.anchor.setTo(0.5, 0.5);
	},
	update: function(){

	},
	startGame: function(){
		game.state.start('mainLoop');
	}
};

myGame.mainLoop = function(game){};
myGame.mainLoop.prototype = {
	preload: function(){
		this.presentTypes = [
		'red_gift',
		'purple_gift',
		'blue_gift'
		];
	},
	create: function(){
		// We're going to be using physics, so enable the Arcade Physics system
		game.physics.startSystem(Phaser.Physics.ARCADE);
		var background = game.add.sprite(0, 0, 'background');
		background.inputEnabled = true;

		this.timerCount = 60;
		this.score = 0;
		var fontStyle = { fontSize: '32px', fill: '#fff' };
		this.scoreText = game.add.text(16, 16, 'Score: ' + this.score.toString(), fontStyle);
		this.timerText = game.add.text(game.width-16, 16, this.timerCount.toString(), fontStyle);
		this.timerText.anchor.setTo(1.0, 0);

		this.timer = game.time.create(false);
		var interval = this.timer.loop(1000, function(){
			this.timerCount--;
			if(this.timerCount === 0){
				this.state.start('loading');
				this.timer.destroy();
			}
		}, this);
		this.timer.start();

		this.platform = game.add.group();
		this.platform.enableBody = true;
		var ground = this.platform.create(0, game.height, 'ground');
		ground.anchor.setTo(0, 1.0);
		ground.body.immovable = true;

		// player and settings
		this.player = game.add.sprite(game.world.centerX, 0.75 * game.world.height, 'dude');
		this.player.anchor.setTo(0.5, 0.5);
		game.physics.arcade.enable(this.player);

		this.player.body.bounce.y = 0.2;
		this.player.body.gravity.y = 300;
		this.player.body.collideWorldBounds = true;

		this.player.animations.add('left', [0, 1, 2, 3], 10, true);
		this.player.animations.add('right', [5, 6, 7, 8], 10, true);

		this.player.moveLeft = function(){
			this.body.velocity.x = -200;
			this.animations.play('left');
		};

		this.player.moveRight = function(){
			this.body.velocity.x = 200;
			this.animations.play('right');
		};
		this.player.stop = function(){
			this.animations.stop();
			this.frame = 4;
		};

		// controls
		this.cursors = game.input.keyboard.createCursorKeys();

		// Capture certain keys to prevent their default actions in the browser.
		// This is only necessary because this is an HTML5 game. Games on other
		// platforms may not need code like 
		game.input.keyboard.addKeyCapture([
			Phaser.Keyboard.LEFT,
			Phaser.Keyboard.RIGHT
		]);

		game.input.onDown.add(function(){
			//console.log('pointer', this.input.activePointer.x, this.input.activePointer.y);
			//console.log('player', player.body.x, player.body.y);
		}, this);


		// presents
		this.presents = game.add.group();
		this.presents.enableBody = true;
		for(var i = 0; i < myGame.NUM_PRESENTS; i++){
			this.createRandomPresent();
		}
	},
	update: function(){
		//update score
		this.scoreText.text = "Score: " + this.score;
		this.timerText.text = this.timerCount.toString();

		game.physics.arcade.collide(this.player, this.platform);

		game.physics.arcade.overlap(this.platform, this.presents, this.missPresent, null, this);
		game.physics.arcade.overlap(this.player, this.presents, this.collectPresent, null, this);

		this.player.body.velocity.x = 0;

		if (this.isLeftActive()){
			this.player.moveLeft();
		} else if (this.isRightActive()){
			this.player.moveRight();
		} else {
			this.player.stop();
		}
	},
	missPresent: function(platform, present){
		present.kill();
		this.createRandomPresent();
	},
	collectPresent: function(player, present){
		this.score += 10;
		present.kill();
		this.createRandomPresent();
	},
	createRandomPresent: function(){
		var present = this.createPresent(0, Math.random() * -1000);
		//we don't know the width of the present until it's constructed, so adjust after that 
		present.x = Math.random() * (game.width - present.width);
	},
	createPresent: function(x, y){
		console.log(this);
		var present = this.presents.create(x, y, this.presentTypes[Math.floor(Math.random() * this.presentTypes.length)]);
		present.body.gravity.y = 100;
		present.body.maxVelocity.setTo(0, myGame.MAX_SPEED); //x, y
		return present;
	},
	isLeftActive: function(){
		var isActive = false;

		isActive = game.input.keyboard.isDown(Phaser.Keyboard.LEFT);
		isActive |= game.input.activePointer.isDown && game.input.activePointer.x + 5 < this.player.x;

		return isActive;
	},
	isRightActive: function(){
		var isActive = false;

		isActive = game.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
		isActive |= game.input.activePointer.isDown && game.input.activePointer.x - 5 > this.player.x;

		return isActive;
	}
};

var finish =function(game){};
finish.prototype = {
	update: function(){

	}
};

var game = new Phaser.Game(myGame.BASE_WIDTH, myGame.BASE_HEIGHT, Phaser.AUTO, 'game', 'loading', false, false);

game.state.add('loading', myGame.loading, true);
game.state.add('mainLoop', myGame.mainLoop, true);
game.state.add('finish', myGame.finish, true);

game.state.start('loading');