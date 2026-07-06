// Marvin mod verden - Version 5.3 gameplay polish
// Mobil-først browser-spil lavet med Phaser.js via CDN.
// Denne fil er komplet og kan overskrive den eksisterende game.js.

const GAME_WIDTH = 480;
const GAME_HEIGHT = 1040;

const STORAGE = {
  highScore: "mmv_highscore_v4",
  wins: "mmv_wins_v4",
  bestTime: "mmv_best_time_v4",
  bestHits: "mmv_best_hits_v4",
  sound: "mmv_sound_on_v4",
  seenTutorial: "mmv_seen_tutorial_v4"
};

const DIFFICULTY = {
  easy: {
    label: "NEM",
    enemySpeed: 0.82,
    enemyShots: 0.70,
    bossHp: 0.82,
    powerChance: 0.12,
    startLives: 4,
    bulletSpeed: 930
  },
  normal: {
    label: "NORMAL",
    enemySpeed: 1.16,
    enemyShots: 1.22,
    bossHp: 1.12,
    powerChance: 0.055,
    startLives: 3,
    bulletSpeed: 970
  },
  chaos: {
    label: "KAOS",
    enemySpeed: 1.45,
    enemyShots: 1.65,
    bossHp: 1.38,
    powerChance: 0.04,
    startLives: 2,
    bulletSpeed: 990
  }
};


const BOSSES = [
  {
    id: "gormi",
    key: "gormi",
    bgKey: "bgStadium",
    name: "GORMI-ZILLA",
    title: "BOSS 1: GORMI-ZILLA",
    intro: "Tved Stadion ryster. Gormi-Zilla tramper ind!",
    theme: "TVED STADION",
    hp: 92,
    color: 0x6cff8e,
    width: 224
  },
  {
    id: "kim",
    key: "kim",
    bgKey: "bgLocker",
    name: "KIMI-KAZE",
    title: "BOSS 2: KIMI-KAZE",
    intro: "Omklædningsrummet bliver stille. Ninjaen angriber!",
    theme: "OMKLÆDNINGSRUMMET",
    hp: 108,
    color: 0x5fb8ff,
    width: 226
  },
  {
    id: "ricki",
    key: "ricki",
    bgKey: "bgCasino",
    name: "RICKO ROYAL",
    title: "BOSS 3: RICKO ROYAL",
    intro: "Pokerbordet er dækket. Korthajen går all-in!",
    theme: "POKERBORDET",
    hp: 122,
    color: 0xffd36a,
    width: 224
  },
  {
    id: "michael",
    key: "michael",
    bgKey: "bgPub",
    name: "MICHAELS CYKELSME'",
    title: "BOSS 4: MICHAELS CYKELSME'",
    intro: "Sports-pubben larmer. Cykelsmeden ruller ind!",
    theme: "SPORTS-PUBBEN",
    hp: 138,
    color: 0x9fe8ff,
    width: 212
  },
  {
    id: "frisko",
    key: "frisko",
    bgKey: "bgDisco",
    name: "FRISKO-DASKO",
    title: "FINAL BOSS: FRISKO-DASKO",
    intro: "Diskokuglen spinner. Frisko-Dasko tænder finalen!",
    theme: "DISKOTEKET",
    hp: 156,
    color: 0xff7be8,
    width: 216
  }
];

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("marvin", "assets/marvin.png");
    this.load.image("gormi", "assets/gormi.png");
    this.load.image("frisko", "assets/frisko.png");
    this.load.image("michael", "assets/michael.png");
    this.load.image("ricki", "assets/ricki.png");
    this.load.image("kim", "assets/kim.png");
    this.load.image("stadiumBg", "assets/stadium-bg.png");
    this.load.image("bgStadium", "assets/bg-stadium.png");
    this.load.image("bgLocker", "assets/bg-locker.png");
    this.load.image("bgCasino", "assets/bg-casino.png");
    this.load.image("bgPub", "assets/bg-pub.png");
    this.load.image("bgDisco", "assets/bg-disco.png");
    this.load.image("tbLogo", "assets/tb-logo.png");
    this.load.image("enemyBallClassic", "assets/enemy-ball-classic.png");
    this.load.image("enemyBallBlue", "assets/enemy-ball-blue.png");
    this.load.image("enemyBallDisco", "assets/enemy-ball-disco.png");
  }

  create() {
    this.createFallbackTextures();
    this.createGameTextures();
    this.readStats();

    this.selectedDifficulty = "normal";
    this.soundOn = localStorage.getItem(STORAGE.sound) !== "off";
    this.gameState = "menu";

    this.createBackground();
    this.createGroups();
    this.createPlayer();
    this.createHud();
    this.createTouchControls();
    this.createKeyboard();
    this.createCollisions();

    this.resetRunValues(false);
    this.applyLevelTheme();
    this.showStartMenu();
  }

  createFallbackTextures() {
    const g = this.add.graphics();

    if (!this.textures.exists("fallbackBall")) {
      g.clear();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(48, 48, 42);
      g.lineStyle(4, 0x111111, 1);
      g.strokeCircle(48, 48, 42);
      g.fillStyle(0x111111, 1);
      g.fillCircle(48, 48, 12);
      g.fillCircle(28, 36, 8);
      g.fillCircle(68, 36, 8);
      g.fillCircle(32, 66, 8);
      g.fillCircle(64, 66, 8);
      g.generateTexture("fallbackBall", 96, 96);
    }

    if (!this.textures.exists("fallbackPlayer")) {
      g.clear();
      g.fillStyle(0x2c8cff, 1);
      g.fillCircle(50, 46, 36);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(38, 42, 6);
      g.fillCircle(62, 42, 6);
      g.fillStyle(0x001133, 1);
      g.fillRoundedRect(22, 70, 56, 22, 10);
      g.generateTexture("fallbackPlayer", 100, 100);
    }

    if (!this.textures.exists("fallbackBoss")) {
      g.clear();
      g.fillStyle(0x003d80, 1);
      g.fillRoundedRect(8, 8, 144, 144, 22);
      g.lineStyle(5, 0xffffff, 1);
      g.strokeRoundedRect(8, 8, 144, 144, 22);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(60, 62, 10);
      g.fillCircle(100, 62, 10);
      g.fillRect(54, 100, 52, 10);
      g.generateTexture("fallbackBoss", 160, 160);
    }

    if (!this.textures.exists("fallbackBg")) {
      g.clear();
      g.fillStyle(0x083c1e, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.lineStyle(4, 0xffffff, 0.25);
      g.strokeRect(42, 110, GAME_WIDTH - 84, GAME_HEIGHT - 150);
      g.lineBetween(GAME_WIDTH / 2, 110, GAME_WIDTH / 2, GAME_HEIGHT - 40);
      g.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 92);
      g.generateTexture("fallbackBg", GAME_WIDTH, GAME_HEIGHT);
    }

    g.destroy();
  }

  createGameTextures() {
    const g = this.add.graphics();

    if (!this.textures.exists("playerLaser")) {
      g.clear();
      g.fillStyle(0x8ff6ff, 1);
      g.fillRoundedRect(5, 0, 4, 34, 2);
      g.fillStyle(0xffffff, 0.95);
      g.fillRoundedRect(6, 1, 2, 30, 1);
      g.lineStyle(2, 0x1ed9ff, 0.9);
      g.strokeRoundedRect(4, 0, 6, 34, 3);
      g.generateTexture("playerLaser", 14, 38);
    }

    if (!this.textures.exists("megaLaser")) {
      g.clear();
      g.fillStyle(0xfff29a, 1);
      g.fillRoundedRect(4, 0, 18, 48, 9);
      g.fillStyle(0xffffff, 0.95);
      g.fillRoundedRect(10, 2, 6, 42, 3);
      g.lineStyle(3, 0xffb300, 0.95);
      g.strokeRoundedRect(3, 0, 20, 48, 10);
      g.generateTexture("megaLaser", 26, 52);
    }

    if (!this.textures.exists("enemyShot")) {
      g.clear();
      g.fillStyle(0xe8f4ff, 1);
      g.fillCircle(12, 12, 8);
      g.lineStyle(2, 0x56b8ff, 0.7);
      g.strokeCircle(12, 12, 9);
      g.generateTexture("enemyShot", 24, 24);
    }

    if (!this.textures.exists("powerShield")) {
      g.clear();
      g.fillStyle(0x60ff9e, 1);
      g.fillCircle(24, 24, 22);
      g.fillStyle(0x083b20, 1);
      g.fillTriangle(14, 22, 24, 34, 34, 22);
      g.generateTexture("powerShield", 48, 48);
    }

    g.destroy();
  }

  readStats() {
    this.highScore = Number(localStorage.getItem(STORAGE.highScore) || 0);
    this.totalWins = Number(localStorage.getItem(STORAGE.wins) || 0);
    this.bestTime = localStorage.getItem(STORAGE.bestTime);
    this.bestHits = localStorage.getItem(STORAGE.bestHits);
  }

  createBackground() {
    const key = this.textures.exists("bgStadium") ? "bgStadium" : (this.textures.exists("stadiumBg") ? "stadiumBg" : "fallbackBg");
    this.bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setDepth(-120);
    const scale = Math.max(GAME_WIDTH / this.bg.width, GAME_HEIGHT / this.bg.height);
    this.bg.setScale(scale);

    this.bgDark = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x00122b, 0.16).setDepth(-119);
    this.bgVignetteTop = this.add.rectangle(GAME_WIDTH / 2, 80, GAME_WIDTH, 160, 0x000000, 0.13).setDepth(-118);
    this.bgVignetteBottom = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH, 160, 0x000000, 0.10).setDepth(-118);

    this.stars = [];
    for (let i = 0; i < 44; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.10, 0.42)
      ).setDepth(-117);
      star.speed = Phaser.Math.FloatBetween(7, 22);
      this.stars.push(star);
    }

    this.pitchGlow = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 125, GAME_WIDTH, 170, 0x00ff77, 0.04).setDepth(-116);
    this.tweens.add({ targets: this.pitchGlow, alpha: { from: 0.03, to: 0.085 }, duration: 1500, yoyo: true, repeat: -1 });

    this.themeOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1e8cff, 0.00).setDepth(-115);
    this.themeNameText = this.add.text(GAME_WIDTH / 2, 104, "", {
      fontFamily: "Arial", fontSize: 15, color: "#ffffff", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setDepth(249).setAlpha(0);
  }

  createGroups() {
    this.playerBullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.powerups = this.physics.add.group();
    this.hazards = this.physics.add.group();
    this.bossGroup = this.physics.add.group();
    this.floatingTexts = this.add.group();
  }

  createPlayer() {
    const key = this.textures.exists("marvin") ? "marvin" : "fallbackPlayer";
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 175, key);
    this.player.setDepth(30);
    this.player.setCollideWorldBounds(true);
    this.player.displayWidth = 86;
    this.player.scaleY = this.player.scaleX;
    this.player.body.setSize(this.player.width * 0.44, this.player.height * 0.50, true);
    this.player.body.setOffset(this.player.width * 0.28, this.player.height * 0.24);

    this.shieldRing = this.add.circle(this.player.x, this.player.y, 50, 0x65ddff, 0.16)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(29)
      .setVisible(false);
  }

  createHud() {
    this.scoreText = this.add.text(12, 12, "", { fontFamily: "Arial", fontSize: 18, color: "#ffffff", fontStyle: "bold" }).setDepth(250);
    this.livesText = this.add.text(12, 36, "", { fontFamily: "Arial", fontSize: 17, color: "#ffffff" }).setDepth(250);
    this.waveText = this.add.text(12, 60, "", { fontFamily: "Arial", fontSize: 14, color: "#cceaff" }).setDepth(250);
    this.powerText = this.add.text(12, 82, "", { fontFamily: "Arial", fontSize: 12, color: "#ffe891", wordWrap: { width: 310 } }).setDepth(250);
    this.statsText = this.add.text(GAME_WIDTH - 12, 12, "", { fontFamily: "Arial", fontSize: 13, color: "#ffffff", align: "right" }).setOrigin(1, 0).setDepth(250);
    this.lifeHeartText = this.add.text(GAME_WIDTH / 2, 24, "", {
      fontFamily: "Arial", fontSize: 28, color: "#ff5b78", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(255);

    this.bossBarBack = this.add.rectangle(GAME_WIDTH / 2, 130, 318, 18, 0x250915, 0.90).setDepth(251).setVisible(false);
    this.bossBarFill = this.add.rectangle(GAME_WIDTH / 2 - 159, 130, 318, 18, 0x54ff8c, 1).setOrigin(0, 0.5).setDepth(252).setVisible(false);
    this.bossText = this.add.text(GAME_WIDTH / 2, 154, "", { fontFamily: "Arial", fontSize: 14, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(252).setVisible(false);
  }

  createTouchControls() {
    this.joystickPointerId = null;
    this.shootPointerId = null;
    this.superPointerId = null;
    this.joystickValue = 0;
    this.touchShooting = false;

    const bottomY = GAME_HEIGHT - 100;

    this.joyBase = this.add.circle(84, bottomY, 60, 0x0b2b57, 0.30).setStrokeStyle(3, 0x9fe0ff, 0.68).setDepth(320);
    this.joyBase.setInteractive(new Phaser.Geom.Circle(84, bottomY, 82), Phaser.Geom.Circle.Contains);
    this.joyKnob = this.add.circle(84, bottomY, 26, 0x8bddff, 0.55).setStrokeStyle(2, 0xffffff, 0.9).setDepth(321);

    this.shootButton = this.add.circle(GAME_WIDTH - 82, bottomY, 58, 0x165bd6, 0.42).setStrokeStyle(3, 0xffffff, 0.85).setDepth(320);
    this.shootButton.setInteractive(new Phaser.Geom.Circle(GAME_WIDTH - 82, bottomY, 72), Phaser.Geom.Circle.Contains);
    this.shootLabel = this.add.text(GAME_WIDTH - 82, bottomY - 10, "SKYD", { fontFamily: "Arial", fontSize: 22, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(321);
    this.shootHint = this.add.text(GAME_WIDTH - 82, bottomY + 21, "hold", { fontFamily: "Arial", fontSize: 11, color: "#dff6ff" }).setOrigin(0.5).setDepth(321);

    this.superButton = this.add.circle(GAME_WIDTH - 82, bottomY - 142, 36, 0x00c781, 0.38).setStrokeStyle(3, 0xffffff, 0.78).setDepth(320);
    this.superButton.setInteractive(new Phaser.Geom.Circle(GAME_WIDTH - 82, bottomY - 142, 48), Phaser.Geom.Circle.Contains);
    this.superLabel = this.add.text(GAME_WIDTH - 82, bottomY - 142, "SUPER", { fontFamily: "Arial", fontSize: 13, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(321);

    this.pauseButton = this.add.circle(GAME_WIDTH - 30, 45, 20, 0x0b2b57, 0.72).setStrokeStyle(2, 0xffffff, 0.85).setDepth(330);
    this.pauseButton.setInteractive();
    this.pauseLabel = this.add.text(GAME_WIDTH - 30, 45, "II", { fontFamily: "Arial", fontSize: 16, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5).setDepth(331);

    this.pauseButton.on("pointerdown", () => {
      if (this.gameState === "playing") this.pauseGame();
      else if (this.gameState === "paused") this.resumeGame();
    });

    this.input.on("pointerdown", pointer => this.handlePointerDown(pointer));
    this.input.on("pointermove", pointer => this.handlePointerMove(pointer));
    this.input.on("pointerup", pointer => this.handlePointerUp(pointer));
    this.input.on("pointerupoutside", pointer => this.handlePointerUp(pointer));
  }

  createKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      P: Phaser.Input.Keyboard.KeyCodes.P,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      M: Phaser.Input.Keyboard.KeyCodes.M
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

  resetRunValues(resetScore = true) {
    const difficulty = DIFFICULTY[this.selectedDifficulty];
    if (resetScore) {
      this.score = 0;
      this.maxLives = difficulty.startLives;
      this.lives = this.maxLives;
      this.level = 1;
      this.wave = 0;
      this.hitsTaken = 0;
      this.combo = 0;
      this.comboUntil = 0;
      this.runStartedAt = this.time.now;
      this.upgrades = { speed: 0, fireRate: 0, super: 0, shieldLuck: 0, laserTime: 0 };
    }

    // Sikker initialisering til menuen, så HUD aldrig viser undefined/NaN.
    if (typeof this.score !== "number") this.score = 0;
    if (typeof this.maxLives !== "number") this.maxLives = difficulty.startLives;
    if (typeof this.lives !== "number") this.lives = this.maxLives;
    if (typeof this.level !== "number") this.level = 1;
    if (typeof this.wave !== "number") this.wave = 0;
    if (typeof this.hitsTaken !== "number") this.hitsTaken = 0;
    if (typeof this.combo !== "number") this.combo = 0;
    if (typeof this.comboUntil !== "number") this.comboUntil = 0;
    if (!this.upgrades) this.upgrades = { speed: 0, fireRate: 0, super: 0, shieldLuck: 0, laserTime: 0 };

    this.lastShotAt = 0;
    this.doubleLaserUntil = 0;
    this.megaLaserUntil = 0;
    this.speedBoostUntil = 0;
    this.playerSlowUntil = 0;
    this.magnetUntil = 0;
    this.slowMotionUntil = 0;
    this.invincibleUntil = 0;
    this.shieldActive = false;
    this.superReady = true;
    this.superCooldownUntil = 0;
    this.waitingForNextWave = false;
    this.bossIntroActive = false;
    this.bossDefeatTransition = false;
    this.bossStartedForLevel = 0;
    this.lastWaveStartedAt = 0;
    if (this.nextWaveTimer) {
      this.nextWaveTimer.remove(false);
      this.nextWaveTimer = null;
    }
    this.bossActive = false;
    this.boss = null;
    this.bossAura = null;
    this.bossHp = 0;
    this.bossMaxHp = 0;
    this.bossName = "";
    this.bossId = "";
    this.bossColor = 0xffffff;
    this.bossLastAttack = 0;
    this.bossLastSpecial = 0;
    this.bossLastMinion = 0;
    this.keyboardShooting = false;
    this.touchShooting = false;
    this.shootPointerId = null;
    this.superPointerId = null;
    this.resetJoystick();
  }

  clearAllObjects() {
    [this.playerBullets, this.enemyBullets, this.enemies, this.powerups, this.hazards, this.bossGroup].forEach(group => group.clear(true, true));
    this.floatingTexts.clear(true, true);
    if (this.boss) this.boss.destroy();
    if (this.bossAura) this.bossAura.destroy();
    if (this.centerMessage) this.centerMessage.destroy(true);
    if (this.tutorialContainer) this.tutorialContainer.destroy(true);
    if (this.upgradeContainer) this.upgradeContainer.destroy(true);
    if (this.pauseContainer) this.pauseContainer.destroy(true);
    this.setBossUi(false);
  }

  showStartMenu() {
    this.gameState = "menu";
    this.physics.pause();
    this.clearAllObjects();
    if (this.menuContainer) this.menuContainer.destroy(true);

    this.menuContainer = this.add.container(0, 0).setDepth(700);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 430, 650, 0x000000, 0.78).setStrokeStyle(3, 0x7ed6ff, 0.45);
    const title = this.add.text(GAME_WIDTH / 2, 190, "MARVIN\nMOD VERDEN", {
      fontFamily: "Arial", fontSize: 38, color: "#ffffff", fontStyle: "bold", align: "center", lineSpacing: -8
    }).setOrigin(0.5);
    const sub = this.add.text(GAME_WIDTH / 2, 285, "Version 5.1 · Boss-turnering\n5 bosser · 3 waves før hver boss", {
      fontFamily: "Arial", fontSize: 16, color: "#bee4ff", align: "center"
    }).setOrigin(0.5);

    const stats = this.add.text(GAME_WIDTH / 2, 360,
      `Highscore: ${this.highScore}\nSejre: ${this.totalWins}\nBedste tid: ${this.bestTime ? this.formatTime(Number(this.bestTime)) : "--:--"}\nFærrest hits: ${this.bestHits || "-"}`,
      { fontFamily: "Arial", fontSize: 17, color: "#ffe891", align: "center", lineSpacing: 5 }
    ).setOrigin(0.5);

    const diffTitle = this.add.text(GAME_WIDTH / 2, 455, "Sværhedsgrad", { fontFamily: "Arial", fontSize: 16, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const diffButtons = [];
    const names = ["easy", "normal", "chaos"];
    names.forEach((name, i) => {
      const btn = this.makeButton(126 + i * 114, 500, 100, 42, DIFFICULTY[name].label, 15);
      btn.bg.on("pointerdown", () => {
        this.selectedDifficulty = name;
        this.refreshDifficultyButtons(diffButtons);
      });
      diffButtons.push({ name, ...btn });
    });
    this.refreshDifficultyButtons(diffButtons);

    const start = this.makeButton(GAME_WIDTH / 2, 580, 230, 52, "START SPIL", 19);
    start.bg.on("pointerdown", () => this.startGame());

    const how = this.makeButton(GAME_WIDTH / 2, 645, 220, 44, "SÅDAN SPILLER DU", 17);
    how.bg.on("pointerdown", () => this.showTutorial(false));

    const sound = this.makeButton(GAME_WIDTH / 2, 700, 170, 38, this.soundOn ? "LYD: ON" : "LYD: OFF", 15);
    sound.bg.on("pointerdown", () => {
      this.soundOn = !this.soundOn;
      localStorage.setItem(STORAGE.sound, this.soundOn ? "on" : "off");
      sound.label.setText(this.soundOn ? "LYD: ON" : "LYD: OFF");
      this.beep(650, 0.05, "sine", 0.035);
    });

    this.menuContainer.add([panel, title, sub, stats, diffTitle, start.bg, start.label, how.bg, how.label, sound.bg, sound.label]);
    diffButtons.forEach(btn => this.menuContainer.add([btn.bg, btn.label]));
  }

  refreshDifficultyButtons(buttons) {
    buttons.forEach(btn => {
      if (btn.name === this.selectedDifficulty) {
        btn.bg.setFillStyle(0x7ed6ff, 1);
        btn.label.setColor("#06182f");
      } else {
        btn.bg.setFillStyle(0xffffff, 1);
        btn.label.setColor("#06214c");
      }
    });
  }

  makeButton(x, y, w, h, text, fontSize = 18) {
    const bg = this.add.rectangle(x, y, w, h, 0xffffff, 1).setInteractive();
    bg.setStrokeStyle(2, 0x9fe0ff, 0.25);
    const label = this.add.text(x, y, text, { fontFamily: "Arial", fontSize, color: "#06214c", fontStyle: "bold", align: "center" }).setOrigin(0.5);
    bg.on("pointerover", () => bg.setAlpha(0.85));
    bg.on("pointerout", () => bg.setAlpha(1));
    return { bg, label };
  }

  showTutorial(isFirstRun) {
    if (this.tutorialContainer) this.tutorialContainer.destroy(true);
    this.tutorialContainer = this.add.container(0, 0).setDepth(760);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 430, 570, 0x02101f, 0.94).setStrokeStyle(2, 0x8bd8ff, 0.65);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 225, "SÅDAN SPILLER DU", { fontFamily: "Arial", fontSize: 30, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const body = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40,
      "• Brug joysticket til venstre til at styre Marvin.\n\n" +
      "• Hold SKYD til højre for at skyde tynde laserstråler op ad banen.\n\n" +
      "• SUPER-knappen rydder skud og skader bosser, når den er klar.\n\n" +
      "• Saml powerups: TB-skjold, 2X laser og dommerfløjte.\n\n" +
      "• Efter bosser kan du vælge en opgradering.",
      { fontFamily: "Arial", fontSize: 18, color: "#dcecff", wordWrap: { width: 350 }, lineSpacing: 6 }
    ).setOrigin(0.5);
    const close = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 235, 170, 46, isFirstRun ? "START" : "LUK", 18);
    close.bg.on("pointerdown", () => {
      this.tutorialContainer.destroy(true);
      this.tutorialContainer = null;
      localStorage.setItem(STORAGE.seenTutorial, "yes");
      if (isFirstRun) this.beginRunAfterTutorial();
    });
    this.tutorialContainer.add([panel, title, body, close.bg, close.label]);
  }

  startGame() {
    if (this.menuContainer) this.menuContainer.destroy(true);
    if (this.endContainer) this.endContainer.destroy(true);
    this.clearAllObjects();
    this.resetRunValues(true);
    this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 175);
    this.player.setVelocity(0, 0);
    this.player.setVisible(true).setActive(true).setAlpha(1).clearTint();
    this.gameState = "playing";
    this.physics.resume();
    if (localStorage.getItem(STORAGE.seenTutorial) !== "yes") {
      this.gameState = "tutorial";
      this.physics.pause();
      this.showTutorial(true);
      return;
    }
    this.beginRunAfterTutorial();
  }

  beginRunAfterTutorial() {
    this.gameState = "playing";
    this.physics.resume();
    this.runStartedAt = this.time.now;
    this.wave = 0;
    this.waitingForNextWave = true;
    this.bossIntroActive = false;
    this.bossDefeatTransition = false;
    this.lastWaveStartedAt = 0;
    if (this.nextWaveTimer) this.nextWaveTimer.remove(false);
    this.showCenterMessage("MARVIN MOD VERDEN", "Tved Stadion er klar!", 1400);
    this.nextWaveTimer = this.time.delayedCall(1200, () => {
      this.nextWaveTimer = null;
      if (this.gameState === "playing") this.startNextWave();
    });
  }

  pauseGame() {
    if (this.gameState !== "playing") return;
    this.gameState = "paused";
    this.physics.pause();
    this.pauseContainer = this.add.container(0, 0).setDepth(800);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 210, 0x000000, 0.82);
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, "PAUSE", { fontFamily: "Arial", fontSize: 36, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const resume = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 190, 46, "FORTSÆT", 18);
    resume.bg.on("pointerdown", () => this.resumeGame());
    this.pauseContainer.add([panel, text, resume.bg, resume.label]);
  }

  resumeGame() {
    if (this.gameState !== "paused") return;
    this.gameState = "playing";
    this.physics.resume();
    if (this.pauseContainer) this.pauseContainer.destroy(true);
    this.pauseContainer = null;
  }

  update(time, delta) {
    this.updateBackground(delta);

    if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
      if (this.gameState === "playing") this.pauseGame();
      else if (this.gameState === "paused") this.resumeGame();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) {
      this.soundOn = !this.soundOn;
      localStorage.setItem(STORAGE.sound, this.soundOn ? "on" : "off");
      this.showToast(this.soundOn ? "LYD: ON" : "LYD: OFF");
    }

    if (this.gameState !== "playing") {
      this.updateHud();
      return;
    }

    this.handleKeyboard(time);
    this.updatePlayer(time);
    this.updateEnemies(time, delta);
    this.updateBoss(time, delta);
    this.updateProjectiles(delta);
    this.updatePowerups(time, delta);
    this.cleanupObjects();
    this.updateHud();

    const waveHasBeenVisibleLongEnough = this.lastWaveStartedAt === 0 || time - this.lastWaveStartedAt > 1400;
    if (!this.bossActive && !this.bossIntroActive && !this.bossDefeatTransition && !this.waitingForNextWave && waveHasBeenVisibleLongEnough && this.wave > 0 && this.enemies.countActive(true) === 0 && !this.upgradeContainer) {
      this.waitingForNextWave = true;
      if (this.nextWaveTimer) this.nextWaveTimer.remove(false);
      this.nextWaveTimer = this.time.delayedCall(900, () => {
        this.nextWaveTimer = null;
        if (this.gameState !== "playing" || this.bossDefeatTransition) return;
        if (this.wave >= 3) this.startBoss();
        else this.startNextWave();
      });
    }
  }

  updateBackground(delta) {
    this.stars.forEach(star => {
      star.y += star.speed * delta / 1000;
      if (star.y > GAME_HEIGHT) {
        star.y = -4;
        star.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    });
  }

  handleKeyboard(time) {
    this.keyboardShooting = this.keys.SPACE.isDown;
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useSuper();
  }

  updatePlayer(time) {
    let move = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) move = -1;
    if (this.cursors.right.isDown || this.keys.D.isDown) move = 1;
    if (Math.abs(this.joystickValue) > 0.05) move = this.joystickValue;

    const boost = time < this.speedBoostUntil ? 1.42 : 1;
    const oilSlow = time < this.playerSlowUntil ? 0.78 : 1;
    const speed = (305 + (this.upgrades.speed || 0) * 55) * boost * oilSlow;
    this.player.setVelocityX(move * speed);

    if (this.touchShooting || this.keyboardShooting) this.shoot(time);

    if (time < this.invincibleUntil) this.player.setAlpha(Math.floor(time / 85) % 2 === 0 ? 0.46 : 1);
    else this.player.setAlpha(1);

    this.shieldRing.setPosition(this.player.x, this.player.y).setVisible(this.shieldActive);
    if (this.shieldActive) this.shieldRing.rotation += 0.045;
  }

  shoot(time) {
    const baseRate = time < this.doubleLaserUntil ? 95 : 145;
    const rate = Math.max(55, baseRate - (this.upgrades.fireRate || 0) * 30);
    if (time - this.lastShotAt < rate) return;
    this.lastShotAt = time;

    if (time < this.megaLaserUntil) {
      this.spawnPlayerBullet(this.player.x, this.player.y - 48, true);
    } else if (time < this.doubleLaserUntil) {
      this.spawnPlayerBullet(this.player.x - 13, this.player.y - 42);
      this.spawnPlayerBullet(this.player.x + 13, this.player.y - 42);
    } else {
      this.spawnPlayerBullet(this.player.x, this.player.y - 44);
    }
    this.beep(760, 0.025, "square", 0.018);
  }

  spawnPlayerBullet(x, y, mega = false) {
    const bullet = this.physics.add.sprite(x, y, mega ? "megaLaser" : "playerLaser");
    bullet.setDepth(35);
    bullet.body.setAllowGravity(false);
    if (mega) {
      bullet.body.setSize(20, 46, true);
      bullet.setTint(0xfff29a);
    } else {
      bullet.body.setSize(6, 32, true);
    }

    // Vigtigt fix:
    // På nogle mobile browsere/PWA-caches kunne Arcade Physics-velocity på projektiler
    // ende med at stå stille. Derfor flytter vi skud manuelt i updateProjectiles().
    bullet.body.setVelocity(0, 0);
    bullet.projectileVx = 0;
    bullet.projectileVy = mega ? -1040 : -DIFFICULTY[this.selectedDifficulty].bulletSpeed;
    bullet.damage = mega ? 3 : 1;
    this.playerBullets.add(bullet);
  }

  startNextWave() {
    if (this.gameState !== "playing" || this.bossActive || this.bossIntroActive || this.bossDefeatTransition) return;
    if (this.nextWaveTimer) {
      this.nextWaveTimer.remove(false);
      this.nextWaveTimer = null;
    }
    if (this.wave >= 3) {
      this.startBoss();
      return;
    }

    this.waitingForNextWave = false;
    this.wave += 1;
    this.lastWaveStartedAt = this.time.now;
    this.applyLevelTheme();
    if (this.wave === 1) this.showToast("Hold SKYD nede mens du styrer");

    const names = ["T-BORG BOLDE", "ZIGZAG-PRES", "STADION STORM"];
    this.showCenterMessage(`LEVEL ${this.level} · WAVE ${this.wave}`, names[this.wave - 1], 1000);

    if (this.wave === 1) this.spawnFormationRows();
    if (this.wave === 2) this.spawnFormationV();
    if (this.wave === 3) this.spawnFormationCircle();
  }

  getEnemyTexture() {
    if (this.level === 1) return this.textures.exists("enemyBallClassic") ? "enemyBallClassic" : "fallbackBall";
    if (this.level === 2) return this.textures.exists("enemyBallBlue") ? "enemyBallBlue" : "fallbackBall";
    if (this.level === 3) return this.textures.exists("enemyBallDisco") ? "enemyBallDisco" : "fallbackBall";
    if (this.level === 4) return this.textures.exists("enemyBallBlue") ? "enemyBallBlue" : "fallbackBall";
    return this.textures.exists("enemyBallDisco") ? "enemyBallDisco" : "fallbackBall";
  }

  spawnFormationRows() {
    const rows = this.level === 1 ? 2 : 3;
    const cols = 6;
    const gapX = 62;
    const startX = GAME_WIDTH / 2 - ((cols - 1) * gapX) / 2;
    const startY = 185;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = "normal";
        if (this.level >= 2 && (r + c) % 6 === 0) type = "fast";
        else if (this.level >= 3 && (r + c) % 5 === 0) type = "tank";
        else if ((r + c + this.level) % 5 === 0) type = "shooter";
        else if ((r + c) % 3 === 0) type = "wobbler";
        this.spawnEnemy(startX + c * gapX, startY + r * 58, type);
      }
    }
  }

  spawnFormationV() {
    const points = [
      [240, 165], [195, 210], [285, 210], [150, 255], [330, 255], [105, 300], [375, 300],
      [210, 300], [270, 300], [175, 350], [305, 350], [240, 395]
    ];
    points.forEach((p, i) => this.spawnEnemy(p[0], p[1], i % 7 === 0 ? "fast" : i % 5 === 0 ? "tank" : i % 4 === 0 ? "shooter" : i % 3 === 0 ? "wobbler" : "normal"));
  }

  spawnFormationCircle() {
    const cx = GAME_WIDTH / 2;
    const cy = 280;
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 / 14) * i;
      const x = cx + Math.cos(a) * 135;
      const y = cy + Math.sin(a) * 90;
      this.spawnEnemy(x, y, i % 6 === 0 ? "tank" : i % 5 === 0 ? "fast" : i % 4 === 0 ? "shooter" : i % 2 === 0 ? "wobbler" : "normal");
    }
    this.spawnEnemy(cx, cy, "shooter");
  }

  spawnEnemy(x, y, type) {
    const enemy = this.physics.add.sprite(x, y, this.getEnemyTexture());
    enemy.setDepth(18);
    enemy.displayWidth = type === "shooter" ? 45 : type === "tank" ? 52 : type === "fast" ? 34 : 40;
    enemy.scaleY = enemy.scaleX;
    enemy.type = type;
    enemy.hp = type === "normal" ? 1 : type === "fast" ? 1 : type === "wobbler" ? 2 : type === "tank" ? 4 : 3;
    enemy.scoreValue = type === "normal" ? 100 : type === "fast" ? 160 : type === "wobbler" ? 200 : type === "tank" ? 420 : 300;
    if (type === "fast") enemy.setTint(0xff4d4d);
    if (type === "tank") enemy.setTint(0x222222);
    enemy.baseX = x;
    enemy.direction = Phaser.Math.Between(0, 1) ? 1 : -1;
    enemy.waveOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    enemy.lastShotAt = this.time.now + Phaser.Math.Between(500, 1600);
    enemy.body.setAllowGravity(false);
    enemy.body.setSize(enemy.width * 0.66, enemy.height * 0.66, true);
    this.enemies.add(enemy);
  }

  updateEnemies(time, delta) {
    const d = DIFFICULTY[this.selectedDifficulty];
    const slow = time < this.slowMotionUntil ? 0.55 : 1;
    this.enemies.children.iterate(enemy => {
      if (!enemy || !enemy.active) return;
      if (enemy.type === "fast") {
        enemy.x += enemy.direction * (82 + this.level * 8) * d.enemySpeed * slow * delta / 1000;
        enemy.y += (26 + this.level * 5) * d.enemySpeed * slow * delta / 1000;
        if (enemy.x < 28 || enemy.x > GAME_WIDTH - 28) {
          enemy.direction *= -1;
          enemy.y += 18;
        }
      } else if (enemy.type === "tank") {
        enemy.x = enemy.baseX + Math.sin(time / 620 + enemy.waveOffset) * 22;
        enemy.y += (10 + this.level * 2) * d.enemySpeed * slow * delta / 1000;
      } else if (enemy.type === "normal") {
        enemy.x += enemy.direction * (38 + this.level * 6) * d.enemySpeed * slow * delta / 1000;
        enemy.y += 12 * d.enemySpeed * slow * delta / 1000;
        if (enemy.x < 28 || enemy.x > GAME_WIDTH - 28) {
          enemy.direction *= -1;
          enemy.y += 14;
        }
      } else if (enemy.type === "wobbler") {
        enemy.x = enemy.baseX + Math.sin(time / 280 + enemy.waveOffset) * 48;
        enemy.y += (29 + this.level * 4) * d.enemySpeed * slow * delta / 1000;
      } else {
        enemy.x = enemy.baseX + Math.sin(time / 450 + enemy.waveOffset) * 34;
        enemy.y += (17 + this.level * 3) * d.enemySpeed * slow * delta / 1000;
        if (time - enemy.lastShotAt > (1700 - this.level * 110) / d.enemyShots) {
          enemy.lastShotAt = time;
          this.spawnEnemyBullet(enemy.x, enemy.y + 25, 0, 235 * d.enemySpeed * slow, 0xffffff, 1);
        }
      }
      enemy.rotation += 0.05 * slow;
      if (enemy.y > GAME_HEIGHT - 185) this.playerHit(this.player, enemy);
    });
  }

  spawnEnemyBullet(x, y, vx, vy, color, scale = 1) {
    const bullet = this.physics.add.sprite(x, y, "enemyShot");
    bullet.setDepth(19);
    bullet.setTint(color);
    bullet.setScale(scale);
    bullet.body.setAllowGravity(false);
    bullet.body.setCircle(9 * scale);

    // Samme projectile-fix som Marvin-skuddene: manuel bevægelse i updateProjectiles().
    bullet.body.setVelocity(0, 0);
    bullet.projectileVx = vx;
    bullet.projectileVy = vy;
    this.enemyBullets.add(bullet);
  }

  playerBulletHitsEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();
    enemy.hp -= bullet.damage || 1;
    enemy.setTint(0xffffff);
    this.time.delayedCall(45, () => { if (enemy && enemy.active) enemy.clearTint(); });
    this.floatingText(enemy.x, enemy.y - 22, "-1", "#ffffff");
    if (enemy.hp <= 0) {
      this.addScore(enemy.scoreValue, enemy.x, enemy.y);
      this.spawnExplosion(enemy.x, enemy.y, 0xffffff, 8);
      this.dropPowerupMaybe(enemy.x, enemy.y);
      enemy.destroy();
    }
  }

  playerBulletHitsEnemyBullet(playerBullet, enemyBullet) {
    if (playerBullet.active) playerBullet.destroy();
    if (enemyBullet.active) {
      this.spawnExplosion(enemyBullet.x, enemyBullet.y, 0x9fe8ff, 4);
      enemyBullet.destroy();
    }
  }

  dropPowerupMaybe(x, y) {
    const chance = DIFFICULTY[this.selectedDifficulty].powerChance + (this.upgrades.shieldLuck || 0) * 0.035;
    if (Math.random() > chance) return;

    const roll = Math.random();
    let type = "double";
    if (roll < 0.30) type = "double";
    else if (roll < 0.52) type = "shield";
    else if (roll < 0.70) type = "slow";
    else if (roll < 0.86) type = "speed";
    else type = "mega";

    const color = type === "double" ? 0x79e7ff : type === "shield" ? 0x69ff9c : type === "slow" ? 0xffe36a : type === "speed" ? 0xff4d4d : 0xffb300;
    const label = type === "double" ? "2X" : type === "shield" ? "TB" : type === "slow" ? "FL" : type === "speed" ? "LYN" : "MEGA";
    const radius = type === "mega" ? 20 : 16;
    const drop = this.add.circle(x, y, radius, color, 0.95).setDepth(22);
    drop.powerType = type;
    drop.powerupVy = 118;
    drop.powerupVx = Phaser.Math.Between(-16, 16);
    this.physics.add.existing(drop);
    drop.body.setAllowGravity(false);
    drop.body.setCircle(radius);
    drop.body.setVelocity(0, 0);
    this.powerups.add(drop);
    const text = this.add.text(x, y, label, { fontFamily: "Arial", fontSize: type === "mega" ? 9 : 10, color: "#06214c", fontStyle: "bold" }).setOrigin(0.5).setDepth(23);
    text.followTarget = drop;
  }

  collectPowerup(player, drop) {
    if (!drop.active) return;
    if (drop.powerType === "double") {
      this.doubleLaserUntil = this.time.now + 9000 + (this.upgrades.laserTime || 0) * 4500;
      this.showToast("DOBBELT LASER!");
      this.glowPlayer(0x79e7ff);
    } else if (drop.powerType === "shield") {
      this.shieldActive = true;
      this.showToast("TB-SKJOLD AKTIVERET!");
      this.glowPlayer(0x69ff9c);
    } else if (drop.powerType === "slow") {
      this.slowMotionUntil = this.time.now + 4800;
      this.showToast("DOMMERFLØJTE! FJENDERNE BLIVER LANGSOMME");
      this.glowPlayer(0xffe36a);
    } else if (drop.powerType === "speed") {
      this.speedBoostUntil = this.time.now + 7000;
      this.showToast("LYNSKO! MARVIN BLIVER HURTIGERE");
      this.glowPlayer(0xff4d4d);
    } else if (drop.powerType === "mega") {
      this.megaLaserUntil = this.time.now + 5200;
      this.showToast("MEGA-LASER AKTIVERET!");
      this.glowPlayer(0xffb300);
    }
    drop.destroy();
    this.beep(940, 0.08, "sine", 0.04);
  }

  startBoss() {
    if (this.gameState !== "playing" || this.bossActive || this.bossIntroActive || this.bossDefeatTransition) return;
    if (this.bossStartedForLevel === this.level) return;
    this.bossStartedForLevel = this.level;
    this.bossIntroActive = true;
    this.bossActive = true;
    this.waitingForNextWave = false;
    if (this.nextWaveTimer) {
      this.nextWaveTimer.remove(false);
      this.nextWaveTimer = null;
    }
    this.enemies.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.hazards.clear(true, true);
    this.powerups.clear(true, true);
    this.applyLevelTheme();
    const data = this.getBossData();
    this.bossName = data.name;
    this.bossId = data.id;
    this.bossColor = data.color;
    this.bossMaxHp = Math.round(data.hp * DIFFICULTY[this.selectedDifficulty].bossHp);
    this.bossHp = this.bossMaxHp;
    this.showBossIntro(data);
  }

  getBossData() {
    const index = Phaser.Math.Clamp(this.level - 1, 0, BOSSES.length - 1);
    return BOSSES[index];
  }

  spawnBoss(data) {
    const key = this.textures.exists(data.key) ? data.key : "fallbackBoss";
    this.bossAura = this.add.circle(GAME_WIDTH / 2, 220, 95, data.color, 0.13).setStrokeStyle(4, data.color, 0.58).setDepth(14);
    this.boss = this.physics.add.sprite(GAME_WIDTH / 2, 220, key).setDepth(21);
    this.boss.displayWidth = data.width;
    this.boss.scaleY = this.boss.scaleX;
    const finalScale = this.boss.scaleX;
    this.boss.setScale(finalScale * 0.25).setAlpha(0);
    this.tweens.add({ targets: this.boss, scale: finalScale, alpha: 1, duration: 620, ease: "Back.Out" });
    this.boss.body.setAllowGravity(false);
    this.boss.body.setImmovable(true);
    this.boss.body.setSize(this.boss.width * 0.54, this.boss.height * 0.58, true);
    this.bossGroup.add(this.boss);
    this.bossLastAttack = this.time.now;
    this.bossLastSpecial = this.time.now;
    this.bossLastMinion = this.time.now;
    this.setBossUi(true, data.name, data.color);
  }

  updateBoss(time, delta) {
    if (!this.bossActive || !this.boss || !this.boss.active) return;
    const hpPct = this.bossHp / this.bossMaxHp;
    const phase = hpPct < 0.30 ? 1.45 : hpPct < 0.60 ? 1.22 : 1;
    const slow = time < this.slowMotionUntil ? 0.66 : 1;
    const d = DIFFICULTY[this.selectedDifficulty];

    if (this.bossId === "gormi") this.updateGormiBoss(time, phase, slow, d, hpPct);
    else if (this.bossId === "kim") this.updateKimBoss(time, phase, slow, d, hpPct);
    else if (this.bossId === "ricki") this.updateRickiBoss(time, phase, slow, d, hpPct);
    else if (this.bossId === "michael") this.updateMichaelBoss(time, phase, slow, d, hpPct);
    else if (this.bossId === "frisko") this.updateFriskoBoss(time, phase, slow, d, hpPct);

    if (this.bossAura) {
      this.bossAura.setPosition(this.boss.x, this.boss.y);
      this.bossAura.setAlpha(0.12 + Math.abs(Math.sin(time / 260)) * 0.13);
    }
    this.bossBarFill.width = Phaser.Math.Clamp((this.bossHp / this.bossMaxHp) * 318, 0, 318);
  }

  updateGormiBoss(time, phase, slow, d, hpPct) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 760) * 108;
    this.boss.y = 218 + Math.sin(time / 420) * 12;
    if (time - this.bossLastAttack > 980 / phase / d.enemyShots) {
      this.bossLastAttack = time;
      this.spawnEnemyBullet(this.boss.x - 25, this.boss.y + 54, -35, 240 * slow, 0x75ff8f, 1.1);
      this.spawnEnemyBullet(this.boss.x + 25, this.boss.y + 54, 35, 240 * slow, 0x75ff8f, 1.1);
    }
    if (hpPct < 0.60 && time - this.bossLastSpecial > 2800 / phase) {
      this.bossLastSpecial = time;
      this.spawnWarningBeam(this.boss.x, 0x66ff8e);
    }
    // Gormi-Zilla spawner ikke længere ekstra bolde midt i bosskampen.
  }


  updateKimBoss(time, phase, slow, d, hpPct) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 420) * 118;
    this.boss.y = 216 + Math.cos(time / 520) * 18;
    this.boss.rotation = Math.sin(time / 220) * 0.04;
    if (time - this.bossLastAttack > 720 / phase / d.enemyShots) {
      this.bossLastAttack = time;
      const dir = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      const speed = 285 * slow;
      this.spawnEnemyBullet(this.boss.x, this.boss.y + 55, Math.cos(dir) * speed, Math.sin(dir) * speed, 0x66bbff, 1.05);
      this.spawnEnemyBullet(this.boss.x - 32, this.boss.y + 45, -78, 245 * slow, 0x66bbff, 0.9);
      this.spawnEnemyBullet(this.boss.x + 32, this.boss.y + 45, 78, 245 * slow, 0x66bbff, 0.9);
    }
    if (hpPct < 0.62 && time - this.bossLastSpecial > 2350 / phase) {
      this.bossLastSpecial = time;
      for (let i = -2; i <= 2; i++) this.spawnEnemyBullet(this.boss.x, this.boss.y + 54, i * 38, 250 * slow, 0xaad8ff, 0.88);
    }
  }

  updateRickiBoss(time, phase, slow, d, hpPct) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 690) * 102;
    this.boss.y = 218 + Math.sin(time / 360) * 13;
    if (time - this.bossLastAttack > 920 / phase / d.enemyShots) {
      this.bossLastAttack = time;
      for (let i = -2; i <= 2; i++) this.spawnEnemyBullet(this.boss.x, this.boss.y + 60, i * 44, 238 * slow, 0xffd36a, 1.0);
    }
    if (hpPct < 0.58 && time - this.bossLastSpecial > 2650 / phase) {
      this.bossLastSpecial = time;
      this.spawnWarningBeam(this.boss.x + Phaser.Math.Between(-80, 80), 0xffd36a);
    }
  }

  updateFriskoBoss(time, phase, slow, d) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 350) * 126;
    this.boss.y = 220 + Math.cos(time / 540) * 26;
    this.boss.rotation = Math.sin(time / 300) * 0.06;
    if (time - this.bossLastAttack > 780 / phase / d.enemyShots) {
      this.bossLastAttack = time;
      for (let i = -2; i <= 2; i++) this.spawnEnemyBullet(this.boss.x, this.boss.y + 56, i * 46, 225 * slow, 0xff80e7, 1);
    }
    if (time - this.bossLastSpecial > 2500 / phase) {
      this.bossLastSpecial = time;
      this.spawnDiscoRing(this.boss.x, this.boss.y + 85);
    }
  }

  updateMichaelBoss(time, phase, slow, d, hpPct) {
    this.boss.x = GAME_WIDTH / 2 + Math.sin(time / 640) * 96;
    this.boss.y = 224 + Math.sin(time / 400) * 10;
    if (time - this.bossLastAttack > 880 / phase / d.enemyShots) {
      this.bossLastAttack = time;
      this.spawnEnemyBullet(this.boss.x - 34, this.boss.y + 58, -72, 245 * slow, 0x9fe8ff, 1.05);
      this.spawnEnemyBullet(this.boss.x + 34, this.boss.y + 58, 72, 245 * slow, 0x9fe8ff, 1.05);
      this.spawnWheelEnemyBullet(this.boss.x + Phaser.Math.Between(-75, 75), this.boss.y + 68);
    }
    if (hpPct < 0.65 && time - this.bossLastSpecial > 2750 / phase) {
      this.bossLastSpecial = time;
      this.spawnOilPatch(Phaser.Math.Between(72, GAME_WIDTH - 72), GAME_HEIGHT - 235);
    }
    if (hpPct < 0.38 && time - this.bossLastMinion > 3300) {
      this.bossLastMinion = time;
      this.spawnEnemy(Phaser.Math.Between(72, GAME_WIDTH - 72), 185, "shooter");
    }
  }

  spawnWarningBeam(x, color) {
    const warning = this.add.rectangle(x, GAME_HEIGHT / 2, 34, GAME_HEIGHT, color, 0.10).setDepth(18);
    this.tweens.add({ targets: warning, alpha: { from: 0.10, to: 0.30 }, duration: 140, yoyo: true, repeat: 3, onComplete: () => {
      warning.destroy();
      const beam = this.add.rectangle(x, GAME_HEIGHT / 2, 24, GAME_HEIGHT, color, 0.36).setDepth(20);
      this.physics.add.existing(beam);
      beam.body.setAllowGravity(false);
      beam.body.setSize(24, GAME_HEIGHT);
      this.enemyBullets.add(beam);
      this.time.delayedCall(380, () => { if (beam.active) beam.destroy(); });
    }});
  }

  spawnDiscoRing(x, y) {
    const ring = this.add.circle(x, y, 18, 0xff80e7, 0.12).setStrokeStyle(4, 0xff80e7, 0.85).setDepth(20);
    this.physics.add.existing(ring);
    ring.body.setAllowGravity(false);
    ring.body.setCircle(18);
    this.enemyBullets.add(ring);
    this.tweens.add({ targets: ring, scale: 4.4, alpha: 0, duration: 690, onUpdate: () => { if (ring.body) ring.body.setCircle(18 * ring.scaleX); }, onComplete: () => { if (ring.active) ring.destroy(); } });
  }

  spawnWheelEnemyBullet(x, y) {
    const key = this.textures.exists("enemyBallBlue") ? "enemyBallBlue" : "fallbackBall";
    const ball = this.physics.add.sprite(x, y, key).setDepth(20);
    ball.displayWidth = 48;
    ball.scaleY = ball.scaleX;
    ball.body.setAllowGravity(false);
    ball.body.setCircle(ball.width * 0.33);
    ball.body.setVelocity(0, 0);
    ball.projectileVx = 0;
    ball.projectileVy = 260;
    ball.customUpdate = () => { ball.rotation += 0.17; };
    this.enemyBullets.add(ball);
  }

  spawnOilPatch(x, y) {
    const patch = this.add.ellipse(x, y, 96, 34, 0x061019, 0.82).setStrokeStyle(2, 0x9fe8ff, 0.28).setDepth(17);
    patch.hazardType = "oil";
    this.physics.add.existing(patch);
    patch.body.setAllowGravity(false);
    patch.body.setSize(96, 34);
    this.hazards.add(patch);
    this.time.delayedCall(3600, () => { if (patch.active) patch.destroy(); });
  }

  playerBulletHitsBoss(bullet) {
    if (!this.bossActive || !this.boss || !this.boss.active) return;
    bullet.destroy();
    this.bossHp -= (bullet.damage || 1) * (this.time.now < this.doubleLaserUntil ? 1.18 : 1);
    this.boss.setTint(0xffffff);
    this.cameras.main.shake(35, 0.003);
    this.time.delayedCall(40, () => { if (this.boss && this.boss.active) this.boss.clearTint(); });
    this.floatingText(this.boss.x + Phaser.Math.Between(-30, 30), this.boss.y - 55, "-1", "#ffffff");
    if (this.bossHp <= 0) this.defeatBoss();
  }

  defeatBoss() {
    if (!this.boss) return;
    const x = this.boss.x;
    const y = this.boss.y;
    this.spawnExplosion(x, y, this.bossColor, 28);
    this.cameras.main.shake(280, 0.018);
    this.beep(180, 0.20, "triangle", 0.08);
    this.addScore(3000, x, y);
    this.floatingText(x, y - 95, "+3000 BOSS BONUS", "#ffe891");
    this.boss.destroy();
    this.boss = null;
    if (this.bossAura) this.bossAura.destroy();
    this.bossGroup.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.hazards.clear(true, true);
    this.powerups.clear(true, true);
    this.bossActive = false;
    this.bossIntroActive = false;
    this.bossDefeatTransition = true;
    this.waitingForNextWave = true;
    this.setBossUi(false);

    this.lives = this.maxLives || DIFFICULTY[this.selectedDifficulty].startLives;
    this.showToast("MARVINS LIV ER FYLDT OP!");

    if (this.level >= BOSSES.length) {
      this.showCenterMessage("SEJR!", "Marvin slog alle 5 bosser!", 1900);
      this.time.delayedCall(2000, () => this.finishGame(true));
    } else {
      this.showCenterMessage(`${this.bossName} ER NEDE!`, "Vælg en opgradering", 1500);
      this.time.delayedCall(1250, () => this.showUpgradeChoice());
    }
  }

  showUpgradeChoice() {
    if (this.gameState !== "playing") return;
    this.bossDefeatTransition = false;
    this.physics.pause();
    this.gameState = "upgrade";
    this.upgradeContainer = this.add.container(0, 0).setDepth(780);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 430, 420, 0x000000, 0.86).setStrokeStyle(3, 0x8bd8ff, 0.45);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, "VÆLG OPGRADERING", { fontFamily: "Arial", fontSize: 28, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const choices = [
      { text: "Hurtigere Marvin", apply: () => this.upgrades.speed += 1 },
      { text: "Hurtigere skud", apply: () => this.upgrades.fireRate += 1 },
      { text: "SUPER lader hurtigere", apply: () => this.upgrades.super += 1 },
      { text: "Powerups oftere", apply: () => this.upgrades.shieldLuck += 1 },
      { text: "Længere dobbeltlaser", apply: () => this.upgrades.laserTime += 1 }
    ];
    Phaser.Utils.Array.Shuffle(choices).slice(0, 3).forEach((choice, i) => {
      const btn = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 75 + i * 82, 340, 58, choice.text, 19);
      btn.bg.setFillStyle(0xffffff, 1);
      btn.bg.setStrokeStyle(4, 0x7ed6ff, 1);
      btn.label.setColor("#031b3d");
      btn.label.setStroke("#ffffff", 1);
      btn.bg.on("pointerdown", () => {
        choice.apply();
        this.showToast(`OPGRADERING: ${choice.text.toUpperCase()}`);
        this.upgradeContainer.destroy(true);
        this.upgradeContainer = null;
        this.level += 1;
        this.wave = 0;
        this.waitingForNextWave = true;
        this.bossIntroActive = false;
        this.bossActive = false;
        this.bossDefeatTransition = false;
        this.lastWaveStartedAt = 0;
        this.gameState = "playing";
        this.physics.resume();
        if (this.nextWaveTimer) this.nextWaveTimer.remove(false);
        this.nextWaveTimer = this.time.delayedCall(650, () => {
          this.nextWaveTimer = null;
          if (this.gameState === "playing") this.startNextWave();
        });
      });
      this.upgradeContainer.add([btn.bg, btn.label]);
    });
    this.upgradeContainer.add([panel, title]);
  }

  playerHit(player, danger) {
    if (this.gameState !== "playing") return;
    if (this.time.now < this.invincibleUntil) return;
    if (danger && danger.hazardType === "oil") {
      this.playerSlowUntil = this.time.now + 2200;
      this.showToast("OLIE PÅ BANEN! MARVIN BLIVER LANGSOM");
      return;
    }
    if (danger && danger.destroy) danger.destroy();
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
    this.cameras.main.shake(160, 0.012);
    this.beep(100, 0.18, "sawtooth", 0.07);
    this.showToast("AV! MARVIN TOG ET HIT");
    if (this.lives <= 0) this.finishGame(false);
  }

  useSuper() {
    if (!this.superReady || this.gameState !== "playing") return;
    this.superReady = false;
    const cooldown = Math.max(3500, 9000 - (this.upgrades.super || 0) * 2400);
    this.superCooldownUntil = this.time.now + cooldown;
    this.beep(1040, 0.12, "square", 0.045);
    const pulse = this.add.circle(this.player.x, this.player.y, 40, 0x79e3ff, 0.35).setDepth(65);
    this.tweens.add({ targets: pulse, scale: 12, alpha: 0, duration: 420, onComplete: () => pulse.destroy() });
    this.enemies.children.iterate(enemy => {
      if (!enemy || !enemy.active) return;
      this.addScore(enemy.scoreValue, enemy.x, enemy.y);
      this.spawnExplosion(enemy.x, enemy.y, 0x79e3ff, 7);
      enemy.destroy();
    });
    this.enemyBullets.clear(true, true);
    if (this.bossActive) {
      this.bossHp -= 10;
      if (this.bossHp <= 0) this.defeatBoss();
    }
  }


  updatePowerups(time, delta) {
    const dt = delta / 1000;
    this.powerups.children.iterate(drop => {
      if (!drop || !drop.active) return;

      let vx = drop.powerupVx || 0;
      let vy = drop.powerupVy || 0;

      if (time < this.magnetUntil) {
        const angle = Phaser.Math.Angle.Between(drop.x, drop.y, this.player.x, this.player.y);
        vx += Math.cos(angle) * 120;
        vy += Math.sin(angle) * 120;
      }

      const nextX = drop.x + vx * dt;
      const nextY = drop.y + vy * dt;
      drop.setPosition(nextX, nextY);
      if (drop.body && drop.body.reset) drop.body.reset(nextX, nextY);
    });
  }

  applyLevelTheme() {
    const data = this.getBossData ? this.getBossData() : BOSSES[0];
    if (this.bg && data && data.bgKey && this.textures.exists(data.bgKey) && this.bg.texture.key !== data.bgKey) {
      this.bg.setTexture(data.bgKey);
      const scale = Math.max(GAME_WIDTH / this.bg.width, GAME_HEIGHT / this.bg.height);
      this.bg.setScale(scale);
    }

    if (!this.themeOverlay) return;
    let color = data.color || 0x1e8cff;
    let alpha = 0.06;
    if (data.id === "ricki") alpha = 0.075;
    if (data.id === "frisko") alpha = 0.085;
    if (data.id === "michael") alpha = 0.055;

    this.themeOverlay.setFillStyle(color, alpha);
    if (this.themeNameText) {
      this.themeNameText.setText(`${data.theme} · ${data.name}`).setAlpha(1);
      this.tweens.add({ targets: this.themeNameText, alpha: 0, duration: 2200, delay: 1500 });
    }
  }

  showBossIntro(data) {
    const intro = this.add.container(0, 0).setDepth(900);
    const dark = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.62);
    const small = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 82, "BOSS INDKOMMEN", {
      fontFamily: "Arial", fontSize: 22, color: "#bee4ff", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5);
    const big = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, data.name, {
      fontFamily: "Arial", fontSize: 34, color: "#ffffff", fontStyle: "bold", align: "center",
      stroke: "#000000", strokeThickness: 6, wordWrap: { width: 420 }
    }).setOrigin(0.5);
    const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 54, data.intro, {
      fontFamily: "Arial", fontSize: 16, color: "#ffe891", align: "center", wordWrap: { width: 390 }
    }).setOrigin(0.5);
    intro.add([dark, small, big, sub]);
    intro.setAlpha(0);

    this.tweens.add({ targets: intro, alpha: 1, duration: 450 });
    this.time.delayedCall(4200, () => {
      this.tweens.add({ targets: intro, alpha: 0, duration: 450, onComplete: () => intro.destroy(true) });
      if (this.gameState === "playing" && this.bossActive && !this.bossDefeatTransition && this.bossStartedForLevel === this.level) {
        this.bossIntroActive = false;
        this.spawnBoss(data);
      } else {
        this.bossIntroActive = false;
      }
    });
  }

  spawnVictoryConfetti() {
    for (let i = 0; i < 70; i++) {
      const colors = [0xff5b78, 0xffe36a, 0x79e7ff, 0x69ff9c, 0xffffff];
      const confetti = this.add.rectangle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(-120, -10),
        Phaser.Math.Between(4, 9),
        Phaser.Math.Between(8, 16),
        Phaser.Utils.Array.GetRandom(colors),
        1
      ).setDepth(910);
      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 70,
        x: confetti.x + Phaser.Math.Between(-80, 80),
        rotation: Phaser.Math.FloatBetween(-5, 5),
        duration: Phaser.Math.Between(1800, 3600),
        delay: Phaser.Math.Between(0, 900),
        onComplete: () => confetti.destroy()
      });
    }
  }

  updateProjectiles(delta) {
    const dt = delta / 1000;

    const moveProjectile = obj => {
      if (!obj || !obj.active) return;

      const vx = typeof obj.projectileVx === "number" ? obj.projectileVx : 0;
      const vy = typeof obj.projectileVy === "number" ? obj.projectileVy : 0;

      if (vx !== 0 || vy !== 0) {
        const nextX = obj.x + vx * dt;
        const nextY = obj.y + vy * dt;

        // Vigtigt GitHub/Phaser-fix:
        // Brug Phasers egne sync-metoder i stedet for at skrive direkte til body.x/body.y.
        // Det holder sprite og physics-body låst sammen på både Live Server og GitHub Pages.
        obj.setPosition(nextX, nextY);

        if (obj.body && obj.body.reset) {
          obj.body.reset(nextX, nextY);
        }
      }

      if (obj.customUpdate) obj.customUpdate(delta);
    };

    this.playerBullets.children.iterate(moveProjectile);
    this.enemyBullets.children.iterate(moveProjectile);
  }

  cleanupObjects() {
    [this.playerBullets, this.enemyBullets, this.powerups].forEach(group => {
      group.children.iterate(obj => {
        if (!obj || !obj.active) return;
        if (obj.y < -160 || obj.y > GAME_HEIGHT + 160 || obj.x < -160 || obj.x > GAME_WIDTH + 160) obj.destroy();
      });
    });
    this.children.list.forEach(child => {
      if (!child.followTarget) return;
      if (child.followTarget.active) child.setPosition(child.followTarget.x, child.followTarget.y);
      else child.destroy();
    });
  }

  addScore(points, x = null, y = null) {
    if (this.time.now > this.comboUntil) this.combo = 0;
    this.combo += 1;
    this.comboUntil = this.time.now + 1350;
    const bonus = this.combo >= 4 ? this.combo * 10 : 0;
    this.score += points + bonus;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(STORAGE.highScore, String(this.highScore));
    }
    if (x !== null && y !== null) {
      this.floatingText(x, y, `+${points + bonus}`, bonus ? "#ffe891" : "#ffffff");
      if (bonus) this.floatingText(GAME_WIDTH / 2, 178, `KOMBO x${this.combo}`, "#ffe891");
    }
  }

  spawnExplosion(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 1).setDepth(55);
      this.tweens.add({ targets: p, x: x + Phaser.Math.Between(-58, 58), y: y + Phaser.Math.Between(-58, 58), alpha: 0, scale: 0.3, duration: Phaser.Math.Between(260, 680), onComplete: () => p.destroy() });
    }
  }

  floatingText(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontFamily: "Arial", fontSize: 17, color, fontStyle: "bold", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5).setDepth(500);
    this.floatingTexts.add(t);
    this.tweens.add({ targets: t, y: y - 32, alpha: 0, duration: 760, onComplete: () => t.destroy() });
  }

  showToast(text) {
    const toast = this.add.text(GAME_WIDTH / 2, 175, text, { fontFamily: "Arial", fontSize: 16, color: "#ffffff", fontStyle: "bold", backgroundColor: "#000000aa", padding: { x: 10, y: 6 }, align: "center" }).setOrigin(0.5).setDepth(600);
    this.tweens.add({ targets: toast, y: 145, alpha: 0, duration: 1500, onComplete: () => toast.destroy() });
  }

  showCenterMessage(title, subtitle, duration) {
    if (this.centerMessage) this.centerMessage.destroy(true);
    const box = this.add.container(0, 0).setDepth(620);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 430, 155, 0x000000, 0.66).setStrokeStyle(2, 0x82d8ff, 0.28);
    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 27, title, { fontFamily: "Arial", fontSize: 25, color: "#ffffff", fontStyle: "bold", align: "center", wordWrap: { width: 390 } }).setOrigin(0.5);
    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, subtitle, { fontFamily: "Arial", fontSize: 16, color: "#bee4ff", align: "center", wordWrap: { width: 370 } }).setOrigin(0.5);
    box.add([panel, titleText, subText]);
    this.centerMessage = box;
    this.time.delayedCall(duration, () => { if (this.centerMessage === box) this.centerMessage = null; box.destroy(true); });
  }

  setBossUi(visible, name = "", color = 0xffffff) {
    this.bossBarBack.setVisible(visible);
    this.bossBarFill.setVisible(visible);
    this.bossText.setVisible(visible);
    if (visible) {
      this.bossBarFill.setFillStyle(color, 1);
      this.bossBarFill.width = 318;
      this.bossText.setText(name);
    }
  }

  updateHud() {
    if (!this.superReady && this.time.now >= this.superCooldownUntil && this.gameState === "playing") {
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
    this.livesText.setText(`Liv: ${this.lives}/${this.maxLives || DIFFICULTY[this.selectedDifficulty].startLives}`);
    this.lifeHeartText.setText("♥".repeat(Math.max(0, this.lives)));
    this.waveText.setText(`Boss ${this.level}/${BOSSES.length}${this.bossActive ? " · Bosskamp" : ` · Wave ${Math.max(1, this.wave)}/3`} · ${DIFFICULTY[this.selectedDifficulty].label}`);
    this.powerText.setText(power);
    this.statsText.setText(`High: ${this.highScore}\nTid: ${this.formatTime(elapsed)}`);
    this.superButton.setFillStyle(this.superReady ? 0x00c781 : 0x253448, this.superReady ? 0.45 : 0.35);
    this.superLabel.setText(this.superReady ? "SUPER" : "LADER");
  }

  finishGame(won) {
    if (this.gameState !== "playing") return;
    this.gameState = won ? "victory" : "gameover";
    this.physics.pause();
    const elapsed = Math.floor((this.time.now - this.runStartedAt) / 1000);
    if (won) {
      this.totalWins += 1;
      localStorage.setItem(STORAGE.wins, String(this.totalWins));
      if (!this.bestTime || elapsed < Number(this.bestTime)) {
        this.bestTime = String(elapsed);
        localStorage.setItem(STORAGE.bestTime, this.bestTime);
      }
      if (!this.bestHits || this.hitsTaken < Number(this.bestHits)) {
        this.bestHits = String(this.hitsTaken);
        localStorage.setItem(STORAGE.bestHits, this.bestHits);
      }
    }
    this.showEndScreen(won, elapsed);
  }

  showEndScreen(won, elapsed) {
    if (this.endContainer) this.endContainer.destroy(true);
    this.endContainer = this.add.container(0, 0).setDepth(850);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 430, 420, 0x000000, 0.85).setStrokeStyle(3, 0x85dfff, 0.35);
    if (won) this.spawnVictoryConfetti();
    const heading = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, won ? "SEJR!" : "GAME OVER", { fontFamily: "Arial", fontSize: 40, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 92, won ? "MARVIN KLAREDE HELE BOSS-TURNERINGEN!" : "Verden vandt denne gang.", { fontFamily: "Arial", fontSize: 17, color: won ? "#ffe891" : "#bee4ff", align: "center", wordWrap: { width: 365 }, fontStyle: "bold" }).setOrigin(0.5);
    const scoreLine = `Jeg fik ${this.score} point i Marvin mod verden (${DIFFICULTY[this.selectedDifficulty].label})!`;
    const stats = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, `Score: ${this.score}\nTid: ${this.formatTime(elapsed)}\nHits taget: ${this.hitsTaken}\nHighscore: ${this.highScore}`, { fontFamily: "Arial", fontSize: 18, color: "#ffe891", align: "center", lineSpacing: 5 }).setOrigin(0.5);
    const copy = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 88, 220, 44, "KOPIÉR SCORE", 17);
    copy.bg.on("pointerdown", () => {
      navigator.clipboard?.writeText(scoreLine).then(() => this.showToast("SCORE KOPIERET"), () => this.showToast(scoreLine));
    });
    const restart = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 145, 180, 44, "SPIL IGEN", 18);
    restart.bg.on("pointerdown", () => this.startGame());
    const menu = this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 200, 180, 44, "MENU", 18);
    menu.bg.on("pointerdown", () => { this.endContainer.destroy(true); this.endContainer = null; this.showStartMenu(); });
    this.endContainer.add([panel, heading, subtitle, stats, copy.bg, copy.label, restart.bg, restart.label, menu.bg, menu.label]);
  }

  handlePointerDown(pointer) {
    if (this.gameState !== "playing") return;
    const dxShoot = pointer.x - this.shootButton.x;
    const dyShoot = pointer.y - this.shootButton.y;
    const dxSuper = pointer.x - this.superButton.x;
    const dySuper = pointer.y - this.superButton.y;
    const dxJoy = pointer.x - this.joyBase.x;
    const dyJoy = pointer.y - this.joyBase.y;

    if (Math.sqrt(dxShoot * dxShoot + dyShoot * dyShoot) <= 78 && this.shootPointerId === null) {
      this.shootPointerId = pointer.id;
      this.touchShooting = true;
      this.shootButton.setScale(0.94);
      return;
    }
    if (Math.sqrt(dxSuper * dxSuper + dySuper * dySuper) <= 54 && this.superPointerId === null) {
      this.superPointerId = pointer.id;
      this.useSuper();
      this.superButton.setScale(0.94);
      return;
    }
    if (Math.sqrt(dxJoy * dxJoy + dyJoy * dyJoy) <= 90 && this.joystickPointerId === null) {
      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer);
    }
  }

  handlePointerMove(pointer) {
    if (this.gameState !== "playing") return;
    if (pointer.id === this.joystickPointerId) this.updateJoystick(pointer);
  }

  handlePointerUp(pointer) {
    if (pointer.id === this.joystickPointerId) this.resetJoystick();
    if (pointer.id === this.shootPointerId) {
      this.shootPointerId = null;
      this.touchShooting = false;
      this.shootButton.setScale(1);
    }
    if (pointer.id === this.superPointerId) {
      this.superPointerId = null;
      this.superButton.setScale(1);
    }
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joyBase.x;
    const dy = pointer.y - this.joyBase.y;
    const maxDist = 40;
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
    if (this.joyKnob && this.joyBase) {
      this.joyKnob.x = this.joyBase.x;
      this.joyKnob.y = this.joyBase.y;
    }
  }

  glowPlayer(color) {
    this.player.setTint(color);
    this.time.delayedCall(160, () => { if (this.player.active) this.player.clearTint(); });
  }

  formatTime(seconds) {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  beep(freq, duration, type, volume) {
    if (!this.soundOn) return;
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
      // Lyd er valgfri. Spillet fortsætter uden lyd.
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#041127",
  input: {
    activePointers: 5
  },
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
