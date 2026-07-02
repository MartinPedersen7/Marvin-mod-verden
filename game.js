// Marvin mod verden - Version 3
// Komplet mobilvenlig Phaser-version med joystick, separat SKYD/SUPER,
// sværhedsgrad, forbedrede projektiler, bedre cleanup og gennemsigtige assets.

const GAME_WIDTH = 480;
const GAME_HEIGHT = 800;

const STORAGE = {
  highScore: "marvin_mod_verden_v3_highscore",
  wins: "marvin_mod_verden_v3_wins",
  bestTime: "marvin_mod_verden_v3_best_time",
  bestHits: "marvin_mod_verden_v3_best_hits",
  sound: "marvin_mod_verden_v3_sound",
  difficulty: "marvin_mod_verden_v3_difficulty"
};

const DIFFICULTY = {
  easy: {
    label: "NEM",
    lives: 4,
    enemySpeed: 0.86,
    bulletSpeed: 0.82,
    enemyFire: 1.25,
    bossHp: 0.82,
    powerDrop: 0.23
  },
  normal: {
    label: "NORMAL",
    lives: 3,
    enemySpeed: 1,
    bulletSpeed: 1,
    enemyFire: 1,
    bossHp: 1,
    powerDrop: 0.18
  },
  chaos: {
    label: "KAOS",
    lives: 3,
    enemySpeed: 1.18,
    bulletSpeed: 1.12,
    enemyFire: 0.78,
    bossHp: 1.18,
    powerDrop: 0.15
  }
};

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("marvin", "assets/marvin.png");
    this.load.image("gormi", "assets/gormi.png");
    this.load.image("frisko", "assets/frisko.png");
    this.load.image("michael", "assets/michael.png");
    this.load.image("stadiumBg", "assets/stadium-bg.png");
    this.load.image("tbLogo", "assets/tb-logo.png");
    this.load.image("enemyBallClassic", "assets/enemy-ball-classic.png");
    this.load.image("enemyBallBlue", "assets/enemy-ball-blue.png");
    this.load.image("enemyBallDisco", "assets/enemy-ball-disco.png");
  }

  create() {
    this.createFallbackTextures();

    this.highScore = Number(localStorage.getItem(STORAGE.highScore) || 0);
    this.totalWins = Number(localStorage.getItem(STORAGE.wins) || 0);
    this.bestTime = this.readNullableNumber(STORAGE.bestTime);
    this.bestHits = this.readNullableNumber(STORAGE.bestHits);
    this.soundEnabled = localStorage.getItem(STORAGE.sound) !== "off";
    this.difficultyKey = localStorage.getItem(STORAGE.difficulty) || "normal";
    if (!DIFFICULTY[this.difficultyKey]) this.difficultyKey = "normal";

    this.activeTimers = [];
    this.transientTweens = [];

    this.createBackground();
    this.createGroups();
    this.createPlayer();
    this.createHud();
    this.createTouchControls();
    this.createKeyboard();
    this.createCollisions();

    this.resetRunValues();
    this.showStartMenu();
  }

  createFallbackTextures() {
    const g = this.add.graphics();

    if (!this.textures.exists("fallbackBall")) {
      g.clear();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(40, 40, 34);
      g.lineStyle(4, 0x111111, 1);
      g.strokeCircle(40, 40, 34);
      g.fillStyle(0x151821, 1);
      g.fillPoints([
        { x: 40, y: 18 }, { x: 56, y: 30 }, { x: 50, y: 50 }, { x: 30, y: 50 }, { x: 24, y: 30 }
      ], true);
      g.generateTexture("fallbackBall", 80, 80);
    }

    if (!this.textures.exists("fallbackPlayer")) {
      g.clear();
      g.fillStyle(0x278cff, 1);
      g.fillCircle(40, 34, 28);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(30, 30, 5);
      g.fillCircle(50, 30, 5);
      g.fillStyle(0x101010, 1);
      g.fillRoundedRect(16, 54, 48, 18, 8);
      g.generateTexture("fallbackPlayer", 80, 80);
    }

    if (!this.textures.exists("fallbackBoss")) {
      g.clear();
      g.fillStyle(0x0c55a1, 1);
      g.fillRoundedRect(10, 10, 140, 140, 20);
      g.lineStyle(5, 0xffffff, 1);
      g.strokeRoundedRect(10, 10, 140, 140, 20);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(58, 62, 10);
      g.fillCircle(102, 62, 10);
      g.fillRect(52, 100, 56, 9);
      g.generateTexture("fallbackBoss", 160, 160);
    }

    if (!this.textures.exists("fallbackBg")) {
      g.clear();
      g.fillStyle(0x073c1e, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.lineStyle(3, 0xffffff, 0.35);
      g.strokeRect(40, 80, GAME_WIDTH - 80, GAME_HEIGHT - 120);
      g.lineBetween(GAME_WIDTH / 2, 80, GAME_WIDTH / 2, GAME_HEIGHT - 40);
      g.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 90);
      g.generateTexture("fallbackBg", GAME_WIDTH, GAME_HEIGHT);
    }

    g.destroy();
  }

  createBackground() {
    const bgKey = this.textures.exists("stadiumBg") ? "stadiumBg" : "fallbackBg";
    this.bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey).setDepth(-120);
    const bgScale = Math.max(GAME_WIDTH / this.bg.width, GAME_HEIGHT / this.bg.height);
    this.bg.setScale(bgScale);

    this.bgBlueOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x00132c, 0.15).setDepth(-119);
    this.bgDarkOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.10).setDepth(-118);

    this.backgroundStars = [];
    for (let i = 0; i < 40; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.12, 0.45)
      ).setDepth(-117);
      star.speed = Phaser.Math.FloatBetween(8, 22);
      this.backgroundStars.push(star);
    }

    this.fieldPulse = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 105, GAME_WIDTH, 155, 0x2dff8d, 0.035).setDepth(-116);
    this.tweens.add({
      targets: this.fieldPulse,
      alpha: { from: 0.025, to: 0.085 },
      duration: 1650,
      yoyo: true,
      repeat: -1
    });
  }

  createGroups() {
    this.playerBullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.powerups = this.physics.add.group();
    this.hazards = this.physics.add.group();
    this.bossGroup = this.physics.add.group();
  }

  createPlayer() {
    const playerKey = this.textures.exists("marvin") ? "marvin" : "fallbackPlayer";
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 132, playerKey);
    this.player.setDepth(30);
    this.player.setCollideWorldBounds(true);
    this.player.displayWidth = 82;
    this.player.scaleY = this.player.scaleX;
    this.player.body.setSize(this.player.width * 0.46, this.player.height * 0.50, true);
    this.player.body.setOffset(this.player.width * 0.27, this.player.height * 0.24);

    this.shieldRing = this.add.circle(this.player.x, this.player.y, 46, 0x74e8ff, 0.16).setDepth(29);
    this.shieldRing.setStrokeStyle(3, 0xffffff, 0.85);
    this.shieldRing.setVisible(false);
  }

  createHud() {
    this.scoreText = this.add.text(10, 8, "", { fontFamily: "Arial", fontSize: "16px", color: "#ffffff", fontStyle: "bold" }).setDepth(300);
    this.livesText = this.add.text(10, 30, "", { fontFamily: "Arial", fontSize: "16px", color: "#ffffff", fontStyle: "bold" }).setDepth(300);
    this.waveText = this.add.text(10, 52, "", { fontFamily: "Arial", fontSize: "14px", color: "#cceaff", fontStyle: "bold" }).setDepth(300);
    this.powerText = this.add.text(10, 73, "", { fontFamily: "Arial", fontSize: "12px", color: "#ffe891", wordWrap: { width: 285 } }).setDepth(300);
    this.statsText = this.add.text(GAME_WIDTH - 10, 8, "", { fontFamily: "Arial", fontSize: "13px", color: "#ffffff", align: "right", fontStyle: "bold" }).setOrigin(1, 0).setDepth(300);

    this.bossBarBack = this.add.rectangle(GAME_WIDTH / 2, 124, 320, 18, 0x220816, 0.90).setDepth(301).setVisible(false);
    this.bossBarFill = this.add.rectangle(GAME_WIDTH / 2 - 160, 124, 320, 18, 0x65ff91, 1).setOrigin(0, 0.5).setDepth(302).setVisible(false);
    this.bossText = this.add.text(GAME_WIDTH / 2, 146, "", { fontFamily: "Arial", fontSize: "14px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(302).setVisible(false);
  }

  createTouchControls() {
    this.joyBase = this.add.circle(78, GAME_HEIGHT - 86, 55, 0x0b2b57, 0.28).setDepth(400);
    this.joyBase.setStrokeStyle(3, 0x9fe0ff, 0.70);
    this.joyBase.setInteractive(new Phaser.Geom.Circle(78, GAME_HEIGHT - 86, 78), Phaser.Geom.Circle.Contains);

    this.joyKnob = this.add.circle(78, GAME_HEIGHT - 86, 24, 0x8bddff, 0.55).setDepth(401);
    this.joyKnob.setStrokeStyle(2, 0xffffff, 0.90);

    this.shootButton = this.add.circle(GAME_WIDTH - 76, GAME_HEIGHT - 86, 53, 0x1767d8, 0.38).setDepth(400).setInteractive();
    this.shootButton.setStrokeStyle(3, 0xffffff, 0.90);
    this.shootLabel = this.add.text(GAME_WIDTH - 76, GAME_HEIGHT - 86, "SKYD", { fontFamily: "Arial", fontSize: "22px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(401);

    this.superButton = this.add.circle(GAME_WIDTH - 76, GAME_HEIGHT - 188, 32, 0x2dff8d, 0.28).setDepth(400).setInteractive();
    this.superButton.setStrokeStyle(3, 0xffffff, 0.80);
    this.superLabel = this.add.text(GAME_WIDTH - 76, GAME_HEIGHT - 188, "SUPER", { fontFamily: "Arial", fontSize: "12px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(401);

    this.pauseButton = this.add.circle(GAME_WIDTH - 30, 43, 18, 0x0b2b57, 0.65).setDepth(405).setInteractive();
    this.pauseButton.setStrokeStyle(2, 0xffffff, 0.85);
    this.pauseLabel = this.add.text(GAME_WIDTH - 30, 43, "II", { fontFamily: "Arial", fontSize: "15px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(406);

    this.pauseButton.on("pointerdown", () => {
      if (this.gameState === "playing") this.pauseGame();
      else if (this.gameState === "paused") this.resumeGame();
    });

    this.shootButton.on("pointerdown", () => {
      if (this.gameState !== "playing") return;
      this.shootHeld = true;
      this.shootButton.setScale(0.94);
    });

    const stopShoot = () => {
      this.shootHeld = false;
      this.shootButton.setScale(1);
    };
    this.shootButton.on("pointerup", stopShoot);
    this.shootButton.on("pointerout", stopShoot);
    this.shootButton.on("pointerupoutside", stopShoot);

    this.superButton.on("pointerdown", () => this.useSuper());

    this.input.on("pointerdown", (pointer) => {
      if (this.gameState !== "playing") return;
      if (pointer.x < GAME_WIDTH * 0.45 && pointer.y > GAME_HEIGHT - 215) {
        this.joystickPointerId = pointer.id;
        this.updateJoystick(pointer);
      }
    });

    this.input.on("pointermove", (pointer) => {
      if (this.gameState !== "playing") return;
      if (pointer.id === this.joystickPointerId) this.updateJoystick(pointer);
    });

    this.input.on("pointerup", (pointer) => {
      if (pointer.id === this.joystickPointerId) this.resetJoystick();
    });
  }

  createKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      P: Phaser.Input.Keyboard.KeyCodes.P,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER
    });
  }

  createCollisions() {
    this.physics.add.overlap(this.playerBullets, this.enemies, this.playerBulletHitsEnemy, null, this);
    this.physics.add.overlap(this.playerBullets, this.bossGroup, this.playerBulletHitsBoss, null, this);
    this.physics.add.overlap(this.playerBullets, this.enemyBullets, this.playerBulletHitsEnemyBullet, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.hazards, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
  }

  resetRunValues() {
    this.gameState = "menu";
    this.score = 0;
    this.lives = DIFFICULTY[this.difficultyKey].lives;
    this.level = 1;
    this.wave = 0;
    this.hitsTaken = 0;
    this.combo = 0;
    this.comboUntil = 0;
    this.runStartedAt = 0;
    this.lastShotAt = 0;
    this.shootHeld = false;
    this.joystickValue = 0;
    this.joystickPointerId = null;
    this.doubleLaserUntil = 0;
    this.slowMotionUntil = 0;
    this.invincibleUntil = 0;
    this.shieldActive = false;
    this.superReady = true;
    this.superCooldownUntil = 0;
    this.boss = null;
    this.bossAura = null;
    this.bossActive = false;
    this.bossHp = 0;
    this.bossMaxHp = 0;
    this.bossName = "";
    this.bossPhase = 0;
    this.bossLastAttack = 0;
    this.bossLastSpecial = 0;
    this.bossLastMinion = 0;
    this.waitingForNextWave = false;
  }

  clearTimers() {
    this.activeTimers.forEach((timer) => {
      if (timer && !timer.hasDispatched) timer.remove(false);
    });
    this.activeTimers = [];
  }

  schedule(delay, callback) {
    const event = this.time.delayedCall(delay, callback);
    this.activeTimers.push(event);
    return event;
  }

  clearAllGameObjects() {
    this.clearTimers();
    [this.playerBullets, this.enemyBullets, this.enemies, this.powerups, this.hazards, this.bossGroup].forEach((group) => group.clear(true, true));

    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossAura) {
      this.bossAura.destroy();
      this.bossAura = null;
    }
    if (this.centerMessage) {
      this.centerMessage.destroy(true);
      this.centerMessage = null;
    }
  }

  showStartMenu() {
    this.gameState = "menu";
    this.physics.pause();
    this.clearAllGameObjects();
    this.player.setVisible(false);
    this.shieldRing.setVisible(false);
    this.setBossUi(false);

    if (this.menuContainer) this.menuContainer.destroy(true);
    this.menuContainer = this.add.container(0, 0).setDepth(700);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 430, 560, 0x000000, 0.78).setStrokeStyle(3, 0x85dfff, 0.45);
    const title = this.add.text(GAME_WIDTH / 2, 126, "MARVIN\nMOD VERDEN", {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      lineSpacing: -8
    }).setOrigin(0.5);

    const sub = this.add.text(GAME_WIDTH / 2, 205, "Tved Stadion er under angreb af fodbold-invaders.", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#bee4ff",
      align: "center",
      wordWrap: { width: 350 }
    }).setOrigin(0.5);

    const stats = this.add.text(
      GAME_WIDTH / 2,
      266,
      `Highscore: ${this.highScore}\nSejre: ${this.totalWins}\nBedste tid: ${this.bestTime === null ? "--:--" : this.formatTime(this.bestTime)}\nFærrest hits: ${this.bestHits === null ? "-" : this.bestHits}`,
      { fontFamily: "Arial", fontSize: "16px", color: "#ffe891", align: "center", lineSpacing: 4 }
    ).setOrigin(0.5);

    const easy = this.makeSmallButton(104, 360, 104, 38, "NEM", this.difficultyKey === "easy");
    const normal = this.makeSmallButton(240, 360, 124, 38, "NORMAL", this.difficultyKey === "normal");
    const chaos = this.makeSmallButton(376, 360, 104, 38, "KAOS", this.difficultyKey === "chaos");

    easy.bg.on("pointerdown", () => this.setDifficulty("easy"));
    normal.bg.on("pointerdown", () => this.setDifficulty("normal"));
    chaos.bg.on("pointerdown", () => this.setDifficulty("chaos"));

    const start = this.makeButton(GAME_WIDTH / 2, 423, 220, 46, "START SPIL");
    start.bg.on("pointerdown", () => this.startGame());

    const how = this.makeButton(GAME_WIDTH / 2, 480, 235, 42, "SÅDAN SPILLER DU");
    how.bg.on("pointerdown", () => this.showHowTo());

    const sound = this.makeButton(GAME_WIDTH / 2, 532, 190, 38, this.soundEnabled ? "LYD: ON" : "LYD: OFF");
    sound.bg.on("pointerdown", () => {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem(STORAGE.sound, this.soundEnabled ? "on" : "off");
      sound.label.setText(this.soundEnabled ? "LYD: ON" : "LYD: OFF");
    });

    this.menuContainer.add([
      panel, title, sub, stats,
      easy.bg, easy.label, normal.bg, normal.label, chaos.bg, chaos.label,
      start.bg, start.label, how.bg, how.label, sound.bg, sound.label
    ]);
  }

  setDifficulty(key) {
    this.difficultyKey = key;
    localStorage.setItem(STORAGE.difficulty, key);
    if (this.menuContainer) this.menuContainer.destroy(true);
    this.showStartMenu();
  }

  makeButton(x, y, w, h, text) {
    const bg = this.add.rectangle(x, y, w, h, 0xffffff, 1).setInteractive();
    const label = this.add.text(x, y, text, { fontFamily: "Arial", fontSize: "17px", color: "#06214c", fontStyle: "bold" }).setOrigin(0.5);
    bg.on("pointerover", () => bg.setFillStyle(0xdff3ff));
    bg.on("pointerout", () => bg.setFillStyle(0xffffff));
    return { bg, label };
  }

  makeSmallButton(x, y, w, h, text, selected) {
    const bg = this.add.rectangle(x, y, w, h, selected ? 0x7fe8ff : 0xffffff, 1).setInteractive();
    bg.setStrokeStyle(selected ? 3 : 0, 0x2dff8d, 0.9);
    const label = this.add.text(x, y, text, { fontFamily: "Arial", fontSize: "14px", color: "#06214c", fontStyle: "bold" }).setOrigin(0.5);
    return { bg, label };
  }

  showHowTo() {
    if (this.howToContainer) this.howToContainer.destroy(true);
    this.howToContainer = this.add.container(0, 0).setDepth(760);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 500, 0x02101f, 0.94).setStrokeStyle(2, 0x8bd8ff, 0.65);
    const title = this.add.text(GAME_WIDTH / 2, 154, "SÅDAN SPILLER DU", { fontFamily: "Arial", fontSize: "28px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const body = this.add.text(
      GAME_WIDTH / 2,
      318,
      "• Joystick til venstre styrer Marvin.\n\n" +
      "• Hold SKYD-knappen for tynde laser-skud op ad banen.\n\n" +
      "• SUPER-knappen rydder skud og skader bosser.\n\n" +
      "• Powerups: TB-skjold, dobbelt laser og dommerfløjte.\n\n" +
      "• Bosser skifter fase, når de mister liv.\n\n" +
      "Desktop: A/D eller piletaster, SPACE, E og P.",
      { fontFamily: "Arial", fontSize: "16px", color: "#dcecff", wordWrap: { width: 350 }, lineSpacing: 5 }
    ).setOrigin(0.5);
    const close = this.makeButton(GAME_WIDTH / 2, 550, 140, 42, "LUK");
    close.bg.on("pointerdown", () => {
      this.howToContainer.destroy(true);
      this.howToContainer = null;
    });
    this.howToContainer.add([panel, title, body, close.bg, close.label]);
  }

  startGame() {
    if (this.menuContainer) {
      this.menuContainer.destroy(true);
      this.menuContainer = null;
    }
    if (this.howToContainer) {
      this.howToContainer.destroy(true);
      this.howToContainer = null;
    }
    if (this.endContainer) {
      this.endContainer.destroy(true);
      this.endContainer = null;
    }

    this.clearAllGameObjects();
    this.resetRunValues();
    this.gameState = "playing";
    this.physics.resume();

    this.player.setVisible(true);
    this.player.setActive(true);
    this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 132);
    this.player.setVelocity(0, 0);
    this.player.clearTint();
    this.player.setAlpha(1);
    this.player.body.enable = true;
    this.resetJoystick();

    this.runStartedAt = this.time.now;
    this.showCenterMessage("MARVIN MOD VERDEN", `${DIFFICULTY[this.difficultyKey].label} · Tved Stadion kalder!`, 1300);
    this.schedule(850, () => {
      if (this.gameState === "playing") this.startNextWave();
    });
  }

  pauseGame() {
    if (this.gameState !== "playing") return;
    this.gameState = "paused";
    this.physics.pause();
    this.pauseContainer = this.add.container(0, 0).setDepth(770);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 190, 0x000000, 0.82);
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "PAUSE\nTryk P eller II", { fontFamily: "Arial", fontSize: "28px", color: "#ffffff", fontStyle: "bold", align: "center" }).setOrigin(0.5);
    this.pauseContainer.add([panel, text]);
  }

  resumeGame() {
    if (this.gameState !== "paused") return;
    this.gameState = "playing";
    this.physics.resume();
    if (this.pauseContainer) {
      this.pauseContainer.destroy(true);
      this.pauseContainer = null;
    }
  }

  update(time, delta) {
    this.updateBackground(delta);

    if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
      if (this.gameState === "playing") this.pauseGame();
      else if (this.gameState === "paused") this.resumeGame();
    }

    if (this.gameState !== "playing") {
      this.updateHud();
      return;
    }

    this.handleKeyboardInput();
    this.updatePlayer(time, delta);
    this.updateEnemies(time, delta);
    this.updateBoss(time, delta);
    this.updateProjectilesAndDrops(delta);
    this.updateHud();

    if (!this.bossActive && !this.waitingForNextWave && this.enemies.countActive(true) === 0) {
      this.waitingForNextWave = true;
      this.schedule(850, () => {
        if (this.gameState === "playing") this.startNextWave();
      });
    }
  }

  updateBackground(delta) {
    this.backgroundStars.forEach((star) => {
      star.y += star.speed * delta / 1000;
      if (star.y > GAME_HEIGHT) {
        star.y = -5;
        star.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    });
  }

  handleKeyboardInput() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useSuper();
    this.keyboardShootHeld = this.keys.SPACE.isDown;
  }

  updatePlayer(time) {
    let move = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) move = -1;
    if (this.cursors.right.isDown || this.keys.D.isDown) move = 1;
    if (Math.abs(this.joystickValue) > 0.05) move = this.joystickValue;

    const speed = time < this.slowMotionUntil ? 185 : 292;
    this.player.setVelocityX(move * speed);

    if (this.shootHeld || this.keyboardShootHeld) this.shoot(time);

    if (time < this.invincibleUntil) {
      this.player.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.45 : 1);
    } else {
      this.player.setAlpha(1);
    }

    this.shieldRing.setPosition(this.player.x, this.player.y);
    this.shieldRing.setVisible(this.shieldActive);
    if (this.shieldActive) this.shieldRing.rotation += 0.045;
  }

  shoot(time) {
    const fireRate = time < this.doubleLaserUntil ? 105 : 160;
    if (time - this.lastShotAt < fireRate) return;
    this.lastShotAt = time;

    if (time < this.doubleLaserUntil) {
      this.spawnPlayerBullet(this.player.x - 12, this.player.y - 39);
      this.spawnPlayerBullet(this.player.x + 12, this.player.y - 39);
    } else {
      this.spawnPlayerBullet(this.player.x, this.player.y - 41);
    }
    this.beep(760, 0.025, "square", 0.018);
  }

  spawnPlayerBullet(x, y) {
    const bullet = this.add.rectangle(x, y, 3.5, 28, 0x8ff7ff, 1).setDepth(35);
    bullet.setStrokeStyle(1, 0xffffff, 0.85);
    bullet.vx = 0;
    bullet.vy = -735;
    bullet.damage = 1;
    bullet.isPlayerBullet = true;
    this.physics.add.existing(bullet);
    bullet.body.setAllowGravity(false);
    bullet.body.setSize(7, 30, true);
    this.playerBullets.add(bullet);
  }

  startNextWave() {
    if (this.gameState !== "playing") return;
    this.waitingForNextWave = false;
    this.wave += 1;

    if (this.wave > 3) {
      this.startBoss();
      return;
    }

    const names = ["T-BORG BOLDE", "DISCO PRES", "STADION STORM"];
    this.showCenterMessage(`LEVEL ${this.level} · WAVE ${this.wave}`, names[this.wave - 1], 1050);

    const rows = this.wave === 1 ? 2 : 3;
    const cols = 6;
    const gapX = 62;
    const startX = GAME_WIDTH / 2 - ((cols - 1) * gapX) / 2;
    const startY = 170;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = "normal";
        if ((r + c + this.level + this.wave) % 5 === 0) type = "shooter";
        else if ((r + c) % 3 === 0) type = "wobbler";
        this.spawnEnemy(startX + c * gapX, startY + r * 54, type);
      }
    }
  }

  getEnemyTexture() {
    if (this.level === 1) return this.textures.exists("enemyBallClassic") ? "enemyBallClassic" : "fallbackBall";
    if (this.level === 2) return this.textures.exists("enemyBallDisco") ? "enemyBallDisco" : "fallbackBall";
    return this.textures.exists("enemyBallBlue") ? "enemyBallBlue" : "fallbackBall";
  }

  spawnEnemy(x, y, type) {
    const enemy = this.physics.add.sprite(x, y, this.getEnemyTexture()).setDepth(18);
    enemy.displayWidth = type === "shooter" ? 43 : 40;
    enemy.scaleY = enemy.scaleX;
    enemy.type = type;
    enemy.hp = type === "normal" ? 1 : type === "wobbler" ? 2 : 3;
    enemy.scoreValue = type === "normal" ? 100 : type === "wobbler" ? 200 : 300;
    enemy.baseX = x;
    enemy.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    enemy.waveOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    enemy.lastShotAt = this.time.now + Phaser.Math.Between(400, 1600);
    enemy.body.setAllowGravity(false);
    enemy.body.setSize(enemy.width * 0.68, enemy.height * 0.68, true);
    this.enemies.add(enemy);
  }

  updateEnemies(time, delta) {
    const d = DIFFICULTY[this.difficultyKey];
    const slow = time < this.slowMotionUntil ? 0.55 : 1;
    const dt = delta / 1000;

    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;

      if (enemy.type === "normal") {
        enemy.x += enemy.direction * (38 + this.level * 8) * d.enemySpeed * slow * dt;
        enemy.y += 12 * d.enemySpeed * slow * dt;
        if (enemy.x < 30 || enemy.x > GAME_WIDTH - 30) {
          enemy.direction *= -1;
          enemy.y += 14;
        }
      }

      if (enemy.type === "wobbler") {
        enemy.x = enemy.baseX + Math.sin(time / 270 + enemy.waveOffset) * 42;
        enemy.y += (27 + this.level * 4) * d.enemySpeed * slow * dt;
      }

      if (enemy.type === "shooter") {
        enemy.x = enemy.baseX + Math.sin(time / 450 + enemy.waveOffset) * 28;
        enemy.y += (15 + this.level * 3) * d.enemySpeed * slow * dt;
        const shotGap = (1550 - this.level * 90) * d.enemyFire;
        if (time - enemy.lastShotAt > shotGap) {
          enemy.lastShotAt = time;
          this.spawnEnemyBullet(enemy.x, enemy.y + 22, 0, 210 * d.bulletSpeed, 0xffffff, 5.5, "spark");
        }
      }

      enemy.rotation += (enemy.type === "wobbler" ? 0.075 : 0.04) * slow;
      enemy.body.reset(enemy.x, enemy.y);

      if (enemy.y > GAME_HEIGHT - 162) this.playerHit(this.player, enemy);
    });
  }

  spawnEnemyBullet(x, y, vx, vy, color, radius, style = "spark") {
    let bullet;
    if (style === "ball") {
      const key = this.textures.exists("enemyBallBlue") ? "enemyBallBlue" : "fallbackBall";
      bullet = this.physics.add.sprite(x, y, key).setDepth(20);
      bullet.displayWidth = radius * 2.25;
      bullet.scaleY = bullet.scaleX;
      bullet.rotationSpeed = 0.16;
      bullet.body.setSize(bullet.width * 0.65, bullet.height * 0.65, true);
    } else {
      bullet = this.add.circle(x, y, radius, color, 0.96).setDepth(20);
      bullet.setStrokeStyle(1, 0x9ee7ff, 0.45);
      this.physics.add.existing(bullet);
      bullet.body.setCircle(radius);
    }
    bullet.vx = vx;
    bullet.vy = vy;
    bullet.isEnemyBullet = true;
    bullet.body.setAllowGravity(false);
    this.enemyBullets.add(bullet);
  }

  playerBulletHitsEnemy(playerBullet, enemy) {
    if (!playerBullet.active || !enemy.active) return;
    playerBullet.destroy();
    enemy.hp -= playerBullet.damage || 1;
    this.showDamageText(enemy.x, enemy.y - 18, "1", 0xffffff);
    enemy.setTint(0xffffff);
    this.schedule(45, () => {
      if (enemy && enemy.active) enemy.clearTint();
    });
    if (enemy.hp <= 0) {
      const score = this.addScore(enemy.scoreValue);
      this.spawnExplosion(enemy.x, enemy.y, this.level === 2 ? 0xff80e7 : 0xffffff, 8);
      this.dropPowerupMaybe(enemy.x, enemy.y);
      enemy.destroy();
      if (this.combo >= 3) this.showCombo(score);
    }
  }

  playerBulletHitsEnemyBullet(playerBullet, enemyBullet) {
    if (playerBullet.active) playerBullet.destroy();
    if (enemyBullet.active) enemyBullet.destroy();
  }

  dropPowerupMaybe(x, y) {
    if (Math.random() > DIFFICULTY[this.difficultyKey].powerDrop) return;
    const roll = Math.random();
    const type = roll < 0.45 ? "double" : roll < 0.75 ? "shield" : "slow";
    const color = type === "double" ? 0x78e7ff : type === "shield" ? 0x68ff9f : 0xffdc5f;
    const label = type === "double" ? "2X" : type === "shield" ? "TB" : "FL";

    const drop = this.add.circle(x, y, 15, color, 0.96).setDepth(22);
    drop.powerType = type;
    drop.vx = 0;
    drop.vy = 120;
    this.physics.add.existing(drop);
    drop.body.setAllowGravity(false);
    drop.body.setCircle(15);
    this.powerups.add(drop);

    const text = this.add.text(x, y, label, { fontFamily: "Arial", fontSize: "10px", color: "#06214c", fontStyle: "bold" }).setOrigin(0.5).setDepth(23);
    text.followTarget = drop;
  }

  collectPowerup(player, drop) {
    if (!drop.active) return;
    if (drop.powerType === "double") {
      this.doubleLaserUntil = this.time.now + 9000;
      this.showToast("DOBBELT LASER!");
    }
    if (drop.powerType === "shield") {
      this.shieldActive = true;
      this.showToast("TB-SKJOLD AKTIVERET!");
    }
    if (drop.powerType === "slow") {
      this.slowMotionUntil = this.time.now + 4800;
      this.showToast("DOMMERFLØJTE! FJENDERNE GÅR NED I FART");
    }
    drop.destroy();
    this.beep(940, 0.07, "sine", 0.04);
  }

  startBoss() {
    if (this.gameState !== "playing") return;
    this.bossActive = true;
    this.enemies.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.hazards.clear(true, true);
    this.waitingForNextWave = false;
    const data = this.getBossData();
    this.bossName = data.name;
    this.bossMaxHp = Math.round(data.hp * DIFFICULTY[this.difficultyKey].bossHp);
    this.bossHp = this.bossMaxHp;
    this.bossColor = data.color;
    this.bossPhase = 1;
    this.showCenterMessage(data.title, data.intro, 1600);
    this.schedule(950, () => {
      if (this.gameState === "playing") this.spawnBoss(data);
    });
  }

  getBossData() {
    if (this.level === 1) {
      return {
        key: this.textures.exists("gormi") ? "gormi" : "fallbackBoss",
        name: "GORMI-ZILLA",
        title: "BOSS: GORMI-ZILLA",
        intro: "Gormi-zilla tramper ind på banen!",
        hp: 95,
        color: 0x68ff8f,
        width: 205
      };
    }
    if (this.level === 2) {
      return {
        key: this.textures.exists("frisko") ? "frisko" : "fallbackBoss",
        name: "FRISKO-DASKO",
        title: "BOSS: FRISKO-DASKO",
        intro: "Frisko-Dasko tænder stadion-discoen!",
        hp: 120,
        color: 0xff80e7,
        width: 202
      };
    }
    return {
      key: this.textures.exists("michael") ? "michael" : "fallbackBoss",
      name: "MICHAELS CYKELSME'",
      title: "FINAL BOSS: MICHAELS CYKELSME'",
      intro: "Michaels Cykelsme' ruller ind med fuld gaz!",
      hp: 150,
      color: 0x9fe8ff,
      width: 202
    };
  }

  spawnBoss(data) {
    this.bossAura = this.add.circle(GAME_WIDTH / 2, 185, 86, data.color, 0.12).setDepth(14);
    this.bossAura.setStrokeStyle(4, data.color, 0.55);

    this.boss = this.physics.add.sprite(GAME_WIDTH / 2, 184, data.key).setDepth(26);
    this.boss.displayWidth = data.width;
    this.boss.scaleY = this.boss.scaleX;
    this.boss.body.setAllowGravity(false);
    this.boss.body.setImmovable(true);
    this.boss.body.setSize(this.boss.width * 0.52, this.boss.height * 0.56, true);
    this.bossGroup.add(this.boss);

    this.bossLastAttack = 0;
    this.bossLastSpecial = 0;
    this.bossLastMinion = 0;
    this.setBossUi(true, data.name, data.color);
  }

  updateBoss(time, delta) {
    if (!this.bossActive || !this.boss || !this.boss.active) return;
    const d = DIFFICULTY[this.difficultyKey];
    const hpPct = this.bossHp / this.bossMaxHp;
    const phase = hpPct < 0.30 ? 3 : hpPct < 0.62 ? 2 : 1;
    if (phase !== this.bossPhase) {
      this.bossPhase = phase;
      const phaseText = phase === 2 ? "FASE 2!" : "RAGE MODE!";
      this.showToast(`${this.bossName}: ${phaseText}`);
      this.cameras.main.shake(120, 0.008);
    }

    const phaseSpeed = phase === 3 ? 1.45 : phase === 2 ? 1.20 : 1;
    const slow = time < this.slowMotionUntil ? 0.65 : 1;

    if (this.level === 1) this.updateGormiBoss(time, phaseSpeed, slow, d);
    if (this.level === 2) this.updateFriskoBoss(time, phaseSpeed, slow, d);
    if (this.level === 3) this.updateMichaelBoss(time, phaseSpeed, slow, d);

    if (this.bossAura) {
      this.bossAura.setPosition(this.boss.x, this.boss.y);
      this.bossAura.setAlpha(0.09 + Math.abs(Math.sin(time / 230)) * 0.14);
    }
    this.boss.body.reset(this.boss.x, this.boss.y);
    this.bossBarFill.width = Phaser.Math.Clamp((this.bossHp / this.bossMaxHp) * 320, 0, 320);
  }

  updateGormiBoss(time, phaseSpeed, slow, d) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 760) * 105;
    this.boss.y = 185 + Math.sin(time / 420) * 10;

    if (time - this.bossLastAttack > (980 / phaseSpeed) * d.enemyFire) {
      this.bossLastAttack = time;
      this.spawnEnemyBullet(this.boss.x - 24, this.boss.y + 46, -38, 235 * d.bulletSpeed * slow, 0x66ff8e, 6, "spark");
      this.spawnEnemyBullet(this.boss.x + 24, this.boss.y + 46, 38, 235 * d.bulletSpeed * slow, 0x66ff8e, 6, "spark");
      if (this.bossPhase >= 2) this.spawnEnemyBullet(this.boss.x, this.boss.y + 54, 0, 260 * d.bulletSpeed * slow, 0x9dff6f, 7, "spark");
    }

    if (this.bossPhase >= 2 && time - this.bossLastSpecial > (2700 / phaseSpeed) * d.enemyFire) {
      this.bossLastSpecial = time;
      this.spawnWarningBeam(this.boss.x, 0x66ff8e);
    }

    if (this.bossPhase >= 3 && time - this.bossLastMinion > 3200) {
      this.bossLastMinion = time;
      this.spawnEnemy(78, 160, "normal");
      this.spawnEnemy(GAME_WIDTH - 78, 170, "wobbler");
    }
  }

  updateFriskoBoss(time, phaseSpeed, slow, d) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 350) * 120;
    this.boss.y = 184 + Math.cos(time / 540) * 24;
    this.boss.rotation = Math.sin(time / 300) * 0.055;

    if (time - this.bossLastAttack > (820 / phaseSpeed) * d.enemyFire) {
      this.bossLastAttack = time;
      const spread = this.bossPhase >= 2 ? 2 : 1;
      for (let i = -spread; i <= spread; i++) {
        this.spawnEnemyBullet(this.boss.x, this.boss.y + 48, i * 48, 225 * d.bulletSpeed * slow, 0xff80e7, 5.5, "spark");
      }
    }

    if (this.bossPhase >= 2 && time - this.bossLastSpecial > (2400 / phaseSpeed) * d.enemyFire) {
      this.bossLastSpecial = time;
      this.spawnDiscoRing(this.boss.x, this.boss.y + 72);
    }

    if (this.bossPhase >= 3 && time - this.bossLastMinion > 3000) {
      this.bossLastMinion = time;
      this.spawnDanceHazard();
    }
  }

  updateMichaelBoss(time, phaseSpeed, slow, d) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 640) * 92;
    this.boss.y = 188 + Math.sin(time / 400) * 10;

    if (time - this.bossLastAttack > (900 / phaseSpeed) * d.enemyFire) {
      this.bossLastAttack = time;
      this.spawnEnemyBullet(this.boss.x - 34, this.boss.y + 52, -64, 238 * d.bulletSpeed * slow, 0x9fe8ff, 5.5, "spark");
      this.spawnEnemyBullet(this.boss.x + 34, this.boss.y + 52, 64, 238 * d.bulletSpeed * slow, 0x9fe8ff, 5.5, "spark");
      if (this.bossPhase >= 2) this.spawnWheelEnemyBullet(this.boss.x + Phaser.Math.Between(-68, 68), this.boss.y + 58);
    }

    if (this.bossPhase >= 2 && time - this.bossLastSpecial > (2800 / phaseSpeed) * d.enemyFire) {
      this.bossLastSpecial = time;
      this.spawnOilPatch(Phaser.Math.Between(70, GAME_WIDTH - 70), GAME_HEIGHT - 190);
    }

    if (this.bossPhase >= 3 && time - this.bossLastMinion > 3200) {
      this.bossLastMinion = time;
      this.spawnEnemy(Phaser.Math.Between(70, GAME_WIDTH - 70), 160, "shooter");
    }
  }

  spawnWarningBeam(x, color) {
    const warning = this.add.rectangle(x, GAME_HEIGHT / 2, 28, GAME_HEIGHT, color, 0.10).setDepth(19);
    const tw = this.tweens.add({
      targets: warning,
      alpha: { from: 0.10, to: 0.30 },
      duration: 130,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warning.destroy();
        const beam = this.add.rectangle(x, GAME_HEIGHT / 2, 18, GAME_HEIGHT, color, 0.35).setDepth(20);
        beam.vx = 0;
        beam.vy = 0;
        beam.lifetime = 420;
        beam.age = 0;
        beam.isEnemyBullet = true;
        this.physics.add.existing(beam);
        beam.body.setAllowGravity(false);
        beam.body.setSize(18, GAME_HEIGHT, true);
        this.enemyBullets.add(beam);
      }
    });
    this.transientTweens.push(tw);
  }

  spawnDiscoRing(x, y) {
    const ring = this.add.circle(x, y, 18, 0xff80e7, 0.12).setDepth(20);
    ring.setStrokeStyle(4, 0xff80e7, 0.85);
    ring.vx = 0;
    ring.vy = 0;
    ring.lifetime = 650;
    ring.age = 0;
    ring.expanding = true;
    this.physics.add.existing(ring);
    ring.body.setAllowGravity(false);
    ring.body.setCircle(18);
    this.enemyBullets.add(ring);
  }

  spawnDanceHazard() {
    const x = Phaser.Math.Between(65, GAME_WIDTH - 65);
    const y = Phaser.Math.Between(270, GAME_HEIGHT - 205);
    const hazard = this.add.rectangle(x, y, 78, 36, 0xff80e7, 0.18).setDepth(19);
    hazard.setStrokeStyle(2, 0xffffff, 0.4);
    hazard.hazardType = "dance";
    hazard.lifetime = 1400;
    hazard.age = 0;
    hazard.pulse = true;
    this.physics.add.existing(hazard);
    hazard.body.setAllowGravity(false);
    hazard.body.setSize(78, 36, true);
    this.hazards.add(hazard);
  }

  spawnWheelEnemyBullet(x, y) {
    this.spawnEnemyBullet(x, y, Phaser.Math.Between(-20, 20), 245 * DIFFICULTY[this.difficultyKey].bulletSpeed, 0x9fe8ff, 22, "ball");
  }

  spawnOilPatch(x, y) {
    const patch = this.add.ellipse(x, y, 96, 32, 0x061019, 0.82).setDepth(19);
    patch.setStrokeStyle(2, 0x9fe8ff, 0.28);
    patch.hazardType = "oil";
    patch.lifetime = 3600;
    patch.age = 0;
    this.physics.add.existing(patch);
    patch.body.setAllowGravity(false);
    patch.body.setSize(96, 32, true);
    this.hazards.add(patch);
  }

  playerBulletHitsBoss(playerBullet) {
    if (!this.bossActive || !this.boss || !this.boss.active) return;
    playerBullet.destroy();
    const damage = this.time.now < this.doubleLaserUntil ? 1.2 : 1;
    this.bossHp -= damage;
    this.showDamageText(this.boss.x + Phaser.Math.Between(-35, 35), this.boss.y - 38, `-${Math.ceil(damage)}`, this.bossColor);
    this.boss.setTint(0xffffff);
    this.schedule(45, () => {
      if (this.boss && this.boss.active) this.boss.clearTint();
    });
    if (this.bossHp <= 0) this.defeatBoss();
  }

  defeatBoss() {
    if (!this.boss) return;
    const x = this.boss.x;
    const y = this.boss.y;
    this.spawnExplosion(x, y, this.bossColor, 28);
    this.cameras.main.shake(260, 0.018);
    this.beep(180, 0.20, "triangle", 0.08);
    this.addScore(3000);

    this.boss.destroy();
    this.boss = null;
    if (this.bossAura) {
      this.bossAura.destroy();
      this.bossAura = null;
    }
    this.bossGroup.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.hazards.clear(true, true);
    this.bossActive = false;
    this.setBossUi(false);

    if (this.level >= 3) {
      this.showCenterMessage("SEJR!", "Marvin slog hele verden på Tved Stadion!", 1600);
      this.schedule(1700, () => this.finishGame(true));
    } else {
      this.showCenterMessage(`${this.bossName} ER NEDE!`, "Vælg upgrade...", 1200);
      this.level += 1;
      this.wave = 0;
      this.schedule(1250, () => this.showUpgradeChoice());
    }
  }

  showUpgradeChoice() {
    if (this.gameState !== "playing") return;
    this.gameState = "upgrade";
    this.physics.pause();
    this.upgradeContainer = this.add.container(0, 0).setDepth(720);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 350, 0x000000, 0.82).setStrokeStyle(2, 0x8bd8ff, 0.55);
    const title = this.add.text(GAME_WIDTH / 2, 255, "VÆLG UPGRADE", { fontFamily: "Arial", fontSize: "28px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const b1 = this.makeButton(GAME_WIDTH / 2, 330, 310, 46, "Hurtigere skud");
    const b2 = this.makeButton(GAME_WIDTH / 2, 392, 310, 46, "Ekstra TB-skjold");
    const b3 = this.makeButton(GAME_WIDTH / 2, 454, 310, 46, "SUPER hurtigere klar");
    b1.bg.on("pointerdown", () => { this.doubleLaserUntil = this.time.now + 6000; this.closeUpgradeAndContinue(); });
    b2.bg.on("pointerdown", () => { this.shieldActive = true; this.closeUpgradeAndContinue(); });
    b3.bg.on("pointerdown", () => { this.superCooldownUntil = Math.max(this.time.now, this.superCooldownUntil - 2500); this.superReady = true; this.closeUpgradeAndContinue(); });
    this.upgradeContainer.add([panel, title, b1.bg, b1.label, b2.bg, b2.label, b3.bg, b3.label]);
  }

  closeUpgradeAndContinue() {
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy(true);
      this.upgradeContainer = null;
    }
    this.gameState = "playing";
    this.physics.resume();
    this.startNextWave();
  }

  playerHit(player, danger) {
    if (this.gameState !== "playing") return;
    if (this.time.now < this.invincibleUntil) return;

    if (danger && danger.hazardType === "oil") {
      this.slowMotionUntil = this.time.now + 2300;
      this.showToast("OLIE PÅ BANEN! MARVIN BLIVER LANGSOM");
      return;
    }

    if (danger && danger.hazardType === "dance") {
      danger.destroy();
    } else if (danger && danger.destroy) {
      danger.destroy();
    }

    if (this.shieldActive) {
      this.shieldActive = false;
      this.invincibleUntil = this.time.now + 950;
      this.showToast("TB-SKJOLD BLOKEREDE!");
      this.beep(260, 0.08, "sine", 0.05);
      return;
    }

    this.lives -= 1;
    this.hitsTaken += 1;
    this.invincibleUntil = this.time.now + 1550;
    this.cameras.main.shake(150, 0.012);
    this.beep(100, 0.18, "sawtooth", 0.07);
    this.showToast("AV! MARVIN TOG ET HIT");
    if (this.lives <= 0) this.finishGame(false);
  }

  useSuper() {
    if (this.gameState !== "playing" || !this.superReady) return;
    this.superReady = false;
    this.superCooldownUntil = this.time.now + 9000;
    this.showCenterMessage("SUPER: STADIONLYS!", "Hele banen blinker!", 750);
    this.beep(1040, 0.12, "square", 0.045);

    const pulse = this.add.circle(this.player.x, this.player.y, 38, 0x79e3ff, 0.35).setDepth(70);
    this.tweens.add({ targets: pulse, scale: 11, alpha: 0, duration: 420, onComplete: () => pulse.destroy() });

    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      this.addScore(enemy.scoreValue);
      this.spawnExplosion(enemy.x, enemy.y, 0x79e3ff, 7);
      enemy.destroy();
    });
    this.enemyBullets.clear(true, true);
    if (this.bossActive) {
      this.bossHp -= 10;
      if (this.bossHp <= 0) this.defeatBoss();
    }
  }

  updateProjectilesAndDrops(delta) {
    const dt = delta / 1000;

    const moveObject = (obj) => {
      if (!obj || !obj.active) return;
      if (typeof obj.vx === "number") obj.x += obj.vx * dt;
      if (typeof obj.vy === "number") obj.y += obj.vy * dt;
      if (obj.rotationSpeed) obj.rotation += obj.rotationSpeed;
      if (obj.expanding) {
        obj.scale += 2.9 * dt;
        obj.alpha = Math.max(0, obj.alpha - 1.55 * dt);
        if (obj.body) obj.body.setCircle(18 * obj.scale);
      }
      if (typeof obj.lifetime === "number") {
        obj.age = (obj.age || 0) + delta;
        if (obj.pulse) obj.alpha = 0.13 + Math.abs(Math.sin(this.time.now / 120)) * 0.20;
        if (obj.age >= obj.lifetime) obj.destroy();
      }
      if (obj.body) obj.body.reset(obj.x, obj.y);
      if (obj.y < -150 || obj.y > GAME_HEIGHT + 150 || obj.x < -150 || obj.x > GAME_WIDTH + 150) obj.destroy();
    };

    this.playerBullets.children.iterate(moveObject);
    this.enemyBullets.children.iterate(moveObject);
    this.powerups.children.iterate(moveObject);
    this.hazards.children.iterate(moveObject);

    this.children.list.forEach((child) => {
      if (!child.followTarget) return;
      if (child.followTarget.active) child.setPosition(child.followTarget.x, child.followTarget.y);
      else child.destroy();
    });
  }

  addScore(points) {
    if (this.time.now > this.comboUntil) this.combo = 0;
    this.combo += 1;
    this.comboUntil = this.time.now + 1450;
    const comboBonus = this.combo >= 3 ? this.combo * 12 : 0;
    const total = points + comboBonus;
    this.score += total;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(STORAGE.highScore, String(this.highScore));
    }
    return total;
  }

  spawnExplosion(x, y, color = 0xffffff, amount = 10) {
    for (let i = 0; i < amount; i++) {
      const piece = this.add.rectangle(x, y, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7), color, 1).setDepth(60);
      this.tweens.add({
        targets: piece,
        x: x + Phaser.Math.Between(-58, 58),
        y: y + Phaser.Math.Between(-58, 58),
        alpha: 0,
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(260, 640),
        onComplete: () => piece.destroy()
      });
    }
  }

  showDamageText(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontFamily: "Arial", fontSize: "13px", color: Phaser.Display.Color.IntegerToColor(color).rgba, fontStyle: "bold" }).setOrigin(0.5).setDepth(520);
    this.tweens.add({ targets: t, y: y - 22, alpha: 0, duration: 520, onComplete: () => t.destroy() });
  }

  showCombo(points) {
    const t = this.add.text(GAME_WIDTH / 2, 196, `KOMBO x${this.combo}  +${points}`, { fontFamily: "Arial", fontSize: "18px", color: "#ffe891", fontStyle: "bold", backgroundColor: "#00000088", padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(520);
    this.tweens.add({ targets: t, y: 170, alpha: 0, duration: 820, onComplete: () => t.destroy() });
  }

  showToast(text) {
    const toast = this.add.text(GAME_WIDTH / 2, 164, text, { fontFamily: "Arial", fontSize: "15px", color: "#ffffff", fontStyle: "bold", align: "center", backgroundColor: "#000000aa", padding: { x: 9, y: 5 }, wordWrap: { width: 360 } }).setOrigin(0.5).setDepth(540);
    this.tweens.add({ targets: toast, y: 138, alpha: 0, duration: 1350, onComplete: () => toast.destroy() });
  }

  showCenterMessage(title, subtitle, duration = 1200) {
    if (this.centerMessage) this.centerMessage.destroy(true);
    const box = this.add.container(0, 0).setDepth(530);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 150, 0x000000, 0.64).setStrokeStyle(2, 0x82d8ff, 0.28);
    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 26, title, { fontFamily: "Arial", fontSize: "25px", color: "#ffffff", fontStyle: "bold", align: "center", wordWrap: { width: 380 } }).setOrigin(0.5);
    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24, subtitle, { fontFamily: "Arial", fontSize: "16px", color: "#bee4ff", align: "center", wordWrap: { width: 360 } }).setOrigin(0.5);
    box.add([panel, titleText, subText]);
    this.centerMessage = box;
    this.schedule(duration, () => {
      if (this.centerMessage === box) this.centerMessage = null;
      box.destroy(true);
    });
  }

  setBossUi(visible, name = "", color = 0xffffff) {
    this.bossBarBack.setVisible(visible);
    this.bossBarFill.setVisible(visible);
    this.bossText.setVisible(visible);
    if (visible) {
      this.bossBarFill.setFillStyle(color, 1);
      this.bossBarFill.width = 320;
      this.bossText.setText(name);
    }
  }

  updateHud() {
    if (this.gameState === "playing" && !this.superReady && this.time.now >= this.superCooldownUntil) {
      this.superReady = true;
      this.showToast("SUPER ER KLAR IGEN");
    }

    const elapsed = this.runStartedAt ? Math.floor((this.time.now - this.runStartedAt) / 1000) : 0;
    const doubleLeft = Math.max(0, Math.ceil((this.doubleLaserUntil - this.time.now) / 1000));
    const slowLeft = Math.max(0, Math.ceil((this.slowMotionUntil - this.time.now) / 1000));
    let power = `Skjold: ${this.shieldActive ? "ON" : "OFF"} · SUPER: ${this.superReady ? "KLAR" : "LADER"}`;
    if (doubleLeft > 0) power += `\n2X Laser: ${doubleLeft}s`;
    if (slowLeft > 0) power += ` · Fløjte: ${slowLeft}s`;

    this.scoreText.setText(`Score: ${this.score}`);
    this.livesText.setText(`Lives: ${"♥".repeat(Math.max(0, this.lives))}`);
    this.waveText.setText(`Level ${this.level}${this.bossActive ? " · Bosskamp" : ` · Wave ${Math.max(1, this.wave)}`}`);
    this.powerText.setText(power);
    this.statsText.setText(`High: ${this.highScore}\nTid: ${this.formatTime(elapsed)}`);

    if (this.superReady) {
      this.superButton.setFillStyle(0x2dff8d, 0.30);
      this.superLabel.setColor("#ffffff");
    } else {
      this.superButton.setFillStyle(0x444444, 0.34);
      this.superLabel.setColor("#bfc9d6");
    }
  }

  finishGame(won) {
    if (this.gameState !== "playing") return;
    this.gameState = won ? "victory" : "gameover";
    this.physics.pause();
    this.clearTimers();
    const elapsed = Math.floor((this.time.now - this.runStartedAt) / 1000);

    if (won) {
      this.totalWins += 1;
      localStorage.setItem(STORAGE.wins, String(this.totalWins));
      if (this.bestTime === null || elapsed < this.bestTime) {
        this.bestTime = elapsed;
        localStorage.setItem(STORAGE.bestTime, String(elapsed));
      }
      if (this.bestHits === null || this.hitsTaken < this.bestHits) {
        this.bestHits = this.hitsTaken;
        localStorage.setItem(STORAGE.bestHits, String(this.hitsTaken));
      }
    }

    this.showEndScreen(won, elapsed);
  }

  showEndScreen(won, elapsed) {
    if (this.endContainer) this.endContainer.destroy(true);
    this.endContainer = this.add.container(0, 0).setDepth(780);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 345, 0x000000, 0.84).setStrokeStyle(3, 0x85dfff, 0.35);
    const heading = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 106, won ? "SEJR!" : "GAME OVER", { fontFamily: "Arial", fontSize: "38px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 52, won ? "Marvin slog hele verden!" : "Verden vandt denne gang.", { fontFamily: "Arial", fontSize: "17px", color: "#bee4ff", align: "center", wordWrap: { width: 360 } }).setOrigin(0.5);
    const stats = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, `Score: ${this.score}\nTid: ${this.formatTime(elapsed)}\nHits taget: ${this.hitsTaken}\nHighscore: ${this.highScore}`, { fontFamily: "Arial", fontSize: "18px", color: "#ffe891", align: "center", lineSpacing: 5 }).setOrigin(0.5);
    const restart = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 122, 180, 44, "SPIL IGEN");
    restart.bg.on("pointerdown", () => this.startGame());
    const menu = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 176, 180, 44, "MENU");
    menu.bg.on("pointerdown", () => {
      this.endContainer.destroy(true);
      this.endContainer = null;
      this.showStartMenu();
    });
    this.endContainer.add([panel, heading, subtitle, stats, restart.bg, restart.label, menu.bg, menu.label]);
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joyBase.x;
    const dy = pointer.y - this.joyBase.y;
    const maxDist = 36;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(distance, maxDist);
    const angle = Math.atan2(dy, dx);
    this.joyKnob.x = this.joyBase.x + Math.cos(angle) * clamped;
    this.joyKnob.y = this.joyBase.y + Math.sin(angle) * clamped;
    this.joystickValue = Phaser.Math.Clamp(dx / maxDist, -1, 1);
  }

  resetJoystick() {
    this.joystickPointerId = null;
    this.joystickValue = 0;
    if (this.joyKnob) {
      this.joyKnob.x = this.joyBase.x;
      this.joyKnob.y = this.joyBase.y;
    }
  }

  readNullableNumber(key) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  formatTime(seconds) {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  beep(freq, duration, type, volume) {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioContext) this.audioContext = new AudioContext();
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (error) {
      // Lyd er valgfrit. Spillet fortsætter uden lyd.
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#041127",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);
