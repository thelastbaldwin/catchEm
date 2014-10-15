var myGame = {};

myGame.NUM_PRESENTS = 12;
myGame.NUM_COAL = 3;
myGame.MAX_SPEED = 125;
myGame.GOLDEN_RATIO = 1.618;
myGame.BASE_WIDTH = 400;
myGame.BASE_HEIGHT = myGame.BASE_WIDTH/myGame.GOLDEN_RATIO;
myGame.score = 0;

myGame.boot = function(game){};
myGame.boot.prototype = {
	preload: function(){
		this.game.load.image('progress', 'img/progress.png');

		this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.game.scale.maxWidth = myGame.BASE_WIDTH * 2;
		this.game.scale.maxHeight = this.game.scale.maxWidth/myGame.GOLDEN_RATIO;
		this.game.scale.setScreenSize(true);
	},
	create: function(){
		this.game.stage.backgroundColor = '#000000';
		// We're going to be using physics, so enable the Arcade Physics system
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.state.start('loading');
	}
};

myGame.loading = function(game){};
myGame.loading.prototype = {
	preload: function(){
		var loadingLabel = this.game.add.text(this.game.world.centerX, 150, 'loading...', {font: '30px Arial', fill: '#ffffff'});
		loadingLabel.anchor.setTo(0.5, 0.5);

		//display the progress bar
		var progressBar = this.game.add.sprite(this.game.world.centerX, 200, 'progress');
		progressBar.anchor.setTo(0.5, 0.5);
		this.game.load.setPreloadSprite(progressBar);

		//load remaining assets
		this.game.load.image('background', 'img/background.png');
		this.game.load.image('red_gift', 'img/present_1.png');
		this.game.load.image('purple_gift', 'img/present_2.png');
		this.game.load.image('blue_gift', 'img/present_3.png');
		this.game.load.image('black_gift', 'img/present_4.png');
		this.game.load.image('ground', 'img/ground.png');
		this.game.load.spritesheet('dude', 'img/dude.png', 32, 48);
		this.game.load.image('start_button', 'img/play_button.png');
	},
	create: function(){
		this.game.state.start('menu');
	}
};

myGame.menu = function(game){};
myGame.menu.prototype = {
	create: function(){
		// x, y, spriteSheet, callback, callbackContext, overFrame, outFrame, downFrame
		this.startButton = this.add.button(this.game.world.centerX, this.game.world.centerY, 'start_button', this.startGame, this);
		this.startButton.anchor.setTo(0.5, 0.5);
	},
	startGame: function(){
		this.game.state.start('mainLoop');
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
		var background = this.game.add.sprite(0, 0, 'background');
		background.inputEnabled = true;

		this.timerCount = 60;
		myGame.score = 0;
		var fontStyle = { fontSize: '32px', fill: '#fff' };
		this.scoreText = this.game.add.text(16, 16, 'Score: ' + myGame.score.toString(), fontStyle);
		this.timerText = this.game.add.text(this.game.width-16, 16, this.timerCount.toString(), fontStyle);
		this.timerText.anchor.setTo(1.0, 0);

		this.timer = this.game.time.create(false);
		var interval = this.timer.loop(1000, function(){
			this.timerCount--;
			if(this.timerCount === 0){
				this.game.state.start('finish');
				this.timer.destroy();
			}
		}, this);
		this.timer.start();

		this.platform = this.game.add.group();
		this.platform.enableBody = true;
		var ground = this.platform.create(0, this.game.height, 'ground');
		ground.anchor.setTo(0, 1.0);
		ground.body.immovable = true;

		// player and settings
		this.player = this.game.add.sprite(this.game.world.centerX, 0.75 * this.game.world.height, 'dude');
		this.game.physics.arcade.enable(this.player);

		this.player.body.bounce.y = 0.2;
		this.player.body.gravity.y = 300;
		this.player.body.collideWorldBounds = true;

		this.player.animations.add('left', [0, 1, 2, 3], 10, true);
		this.player.animations.add('right', [5, 6, 7, 8], 10, true);

		this.player.collectionTween = this.game.add.tween(this.player.scale).to({x: 1.3, y: 1.3}, 50).to({x: 1.0, y: 1.0}, 50);

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

		// presents
		this.presents = this.game.add.group();
		this.presents.enableBody = true;
		for(var i = 0; i < myGame.NUM_PRESENTS; i++){
			this.createRandomPresent();
		}

		// bad presents
		this.coal = this.game.add.group();
		this.coal.enableBody = true;
		for(i = 0; i < myGame.NUM_COAL; i++){
			this.createRandomCoal();
		}
	},
	update: function(){
		//update score
		this.scoreText.text = "Score: " + myGame.score;
		this.timerText.text = this.timerCount.toString();

		this.game.physics.arcade.collide(this.player, this.platform);

		this.game.physics.arcade.overlap(this.platform, this.presents, this.missPresent, null, this);
		this.game.physics.arcade.overlap(this.player, this.presents, this.collectPresent, null, this);
		this.game.physics.arcade.overlap(this.platform, this.coal, this.missCoal, null, this);
		this.game.physics.arcade.overlap(this.player, this.coal, this.collectCoal, null, this);

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
	missCoal: function(platform, coal){
		coal.kill();
		this.createRandomCoal();
	},
	collectPresent: function(player, present){
		myGame.score += 10;
		player.collectionTween.start();
		player.scale.setTo(1);
		present.kill();
		this.createRandomPresent();
	},
	collectCoal: function(player, coal){
		myGame.score -= 10;
		this.constrainScore();
		coal.kill();
		this.createRandomCoal();
	},
	createRandomCoal: function(){
		var coal = this.coal.getFirstDead(),
			y = Math.random() * -1000,
			x;

		if(!coal){
			coal = this.coal.create(0, y, 'black_gift');
		}
		x = Math.random() * (this.game.width - coal.width);
		coal.reset(x, y);
		coal.body.gravity.y = 100;
		coal.body.maxVelocity.setTo(0, myGame.MAX_SPEED * 2);
	},
	createRandomPresent: function(type){
		var present = this.createPresent(0, Math.random() * -1000);
		//we don't know the width of the present until it's constructed, so adjust after that
		present.x = Math.random() * (this.game.width - present.width);
	},
	createPresent: function(x, y){
		var present = this.presents.getFirstDead();

		if(!present){
			present = this.presents.create(x, y, this.presentTypes[Math.floor(Math.random() * this.presentTypes.length)]);
		}
		present.reset(x, y);
		present.body.gravity.y = 100;
		present.body.maxVelocity.setTo(0, myGame.MAX_SPEED); //x, y
		return present;
	},
	constrainScore: function(){
		if (myGame.score <= 0){
			myGame.score = 0;
		}
	},
	isLeftActive: function(){
		return this.game.input.activePointer.isDown && this.game.input.activePointer.x  < this.game.world.width/2;
	},
	isRightActive: function(){
		return this.game.input.activePointer.isDown && this.game.input.activePointer.x  > this.game.world.width/2;
	}
};

myGame.finish =function(game){};
myGame.finish.prototype = {
	preload: function(){
		this.congratulations = [
			'You are the kwisatz haderach of shopping',
			'Is it the shoes?!',
			'You\'re a consumer legend!',
			'Leave some gifts for the other folks!',
			'You have a monopoly on the holidays'
		];
	},
	create: function(){
		var fontStyle = { fontSize: '24px', fill: '#fff', align: 'center', wordWrap: true, wordWrapWidth: this.game.width/2 };
		var expression = this.congratulations[Math.floor(Math.random() * this.congratulations.length)];
		this.congratulationsText = this.game.add.text(this.game.world.centerX, this.game.world.centerY * 0.5, expression, fontStyle);
		this.congratulationsText.anchor.setTo(0.5, 0.5);
		this.startButton = this.add.button(this.game.world.centerX, this.game.world.centerY * 1.5, 'start_button', myGame.loading.prototype.startGame, this);
		this.startButton.anchor.setTo(0.5, 0.5);
	}
};

myGame.game = new Phaser.Game(myGame.BASE_WIDTH, myGame.BASE_HEIGHT, Phaser.CANVAS, 'game');

$(function() {
	myGame.IMAGE_PATH = (window.PageParameters)? window.PageParameters.imageUrl + 'default/shop/image/pop-in-shop/2014/1120/' : '';

	myGame.game.state.add('boot', myGame.boot, true);
	myGame.game.state.add('loading', myGame.loading, true);
	myGame.game.state.add('menu', myGame.menu, true);
	myGame.game.state.add('mainLoop', myGame.mainLoop, true);
	myGame.game.state.add('finish', myGame.finish, true);

	myGame.game.state.start('boot');
});