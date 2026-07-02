// Marvin mod verden
// Touchfix 2:
// - Phaser.Scale.RESIZE: canvas følger iPhone-skærmens faktiske størrelse
// - Native iPhone multitouch: venstre finger styrer, højre finger skyder samtidig
// - Ingen Phaser-touch-knap-konflikt
// - Skud bevæger sig tydeligt opad

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
    this.input.addPointer(8);
    this.input.topOnly = false;

    this.createFallbackTextures();

    this.highScore = Number(localStorage.getItem("marvin_mod_verden_highscore") || 0);
    this.totalWins = Number(localStorage.getItem("marvin_mod_verden_wins") || 0);

    this.gameState = "menu";

    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.wave = 0;
    this.hitsTaken = 0;

    this.lastShotAt = 0;
    this.doubleLaserUntil = 0;
    this.slowMotionUntil = 0;
    this.invincibleUntil = 0;
    this.shieldActive = false;

    this.superReady = true;
    this.superCooldownUntil = 0;

    this.joystickTouchId = null;
    this.joystickValue = 0;

    this.shootTouchIds = new Set();
    this.superTouchIds = new Set();

    this.keyboardShootHeld = false;
    this.shootHeld = false;

    this.boss = null;
    this.bossAura = null;
    this.bossActive = false;
    this.bossHp = 0;
    this.bossMaxHp = 0;
    this.bossName = "";
    this.bossColor = 0xffffff;
    this.bossLastAttack = 0;
    this.bossLastSpecial = 0;
    this.bossLastMinion = 0;

    this.waitingForNextWave = false;

    this.createBackground();
    this.createGroups();
    this.createPlayer();
    this.createHud();
    this.createControls();
    this.createKeyboard();
    this.createCollisions();
    this.installNativeTouchControls();

    this.scale.on("resize", this.handleResize, this);
    this.handleResize({ width: this.W(), height: this.H() });

    this.showStartMenu();
  }

  W() {
    return this.scale.width;
  }

  H() {
    return this.scale.height;
  }

  createFallbackTextures() {
    const g = this.add.graphics();

    if (!this.textures.exists("fallbackBall")) {
      g.clear();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(32, 32, 28);
      g.lineStyle(3, 0x111111, 1);
      g.strokeCircle(32, 32, 28);
      g.fillStyle(0x111111, 1);
      g.fillCircle(32, 32, 8);
      g.fillCircle(18, 24, 5);
      g.fillCircle(46, 24, 5);
      g.fillCircle(22, 46, 5);
      g.fillCircle(42, 46, 5);
      g.generateTexture("fallbackBall", 64, 64);
    }

    if (!this.textures.exists("fallbackPlayer")) {
      g.clear();
      g.fillStyle(0x2c8cff, 1);
      g.fillCircle(40, 38, 30);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(30, 34, 5);
      g.fillCircle(50, 34, 5);
      g.fillStyle(0x111111, 1);
      g.fillRect(18, 56, 44, 16);
      g.generateTexture("fallbackPlayer", 80, 80);
    }

    if (!this.textures.exists("fallbackBoss")) {
      g.clear();
      g.fillStyle(0x003d80, 1);
      g.fillRoundedRect(8, 8, 112, 112, 18);
      g.lineStyle(4, 0xffffff, 1);
      g.strokeRoundedRect(8, 8, 112, 112, 18);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(48, 48, 8);
      g.fillCircle(80, 48, 8);
      g.fillRect(42, 76, 44, 8);
      g.generateTexture("fallbackBoss", 128, 128);
    }

    if (!this.textures.exists("fallbackBg")) {
      g.clear();
      g.fillStyle(0x073c1e, 1);
      g.fillRect(0, 0, 480, 1040);
      g.lineStyle(3, 0xffffff, 0.24);
      g.strokeRect(42, 90, 396, 860);
      g.lineBetween(240, 90, 240, 950);
      g.strokeCircle(240, 520, 95);
      g.generateTexture("fallbackBg", 480, 1040);
    }

    g.destroy();
  }

  createBackground() {
    const key = this.textures.exists("stadiumBg") ? "stadiumBg" : "fallbackBg";

    this.bg = this.add.image(this.W() / 2, this.H() / 2, key);
    this.bg.setDepth(-100);

    this.bgOverlay = this.add.rectangle(this.W() / 2, this.H() / 2, this.W(), this.H(), 0x00142b, 0.16);
    this.bgOverlay.setDepth(-99);

    this.bgDarkener = this.add.rectangle(this.W() / 2, this.H() / 2, this.W(), this.H(), 0x000000, 0.10);
    this.bgDarkener.setDepth(-98);

    this.stars = [];

    for (let i = 0; i < 55; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, this.W()),
        Phaser.Math.Between(0, this.H()),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.10, 0.40)
      );

      star.setDepth(-97);
      star.speed = Phaser.Math.FloatBetween(8, 22);
      this.stars.push(star);
    }

    this.pitchGlow = this.add.rectangle(this.W() / 2, this.H() - 150, this.W(), 190, 0x00ff66, 0.035);
    this.pitchGlow.setDepth(-96);

    this.tweens.add({
      targets: this.pitchGlow,
      alpha: { from: 0.03, to: 0.08 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    this.layoutBackground();
  }

  layoutBackground() {
    const w = this.W();
    const h = this.H();

    if (this.bg) {
      this.bg.setPosition(w / 2, h / 2);
      const scale = Math.max(w / this.bg.width, h / this.bg.height);
      this.bg.setScale(scale);
    }

    if (this.bgOverlay) {
      this.bgOverlay.setPosition(w / 2, h / 2);
      this.bgOverlay.setSize(w, h);
    }

    if (this.bgDarkener) {
      this.bgDarkener.setPosition(w / 2, h / 2);
      this.bgDarkener.setSize(w, h);
    }

    if (this.pitchGlow) {
      this.pitchGlow.setPosition(w / 2, h - 150);
      this.pitchGlow.setSize(w, 190);
    }
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
    const key = this.textures.exists("marvin") ? "marvin" : "fallbackPlayer";

    this.player = this.physics.add.sprite(this.W() / 2, this.H() - 185, key);
    this.player.setDepth(20);
    this.player.setCollideWorldBounds(true);

    this.player.displayWidth = 82;
    this.player.scaleY = this.player.scaleX;

    this.player.body.setAllowGravity(false);
    this.player.body.setSize(this.player.width * 0.46, this.player.height * 0.50, true);
    this.player.body.setOffset(this.player.width * 0.27, this.player.height * 0.24);

    this.shieldRing = this.add.circle(this.player.x, this.player.y, 48, 0x65ddff, 0.18);
    this.shieldRing.setStrokeStyle(3, 0xffffff, 0.9);
    this.shieldRing.setDepth(19);
    this.shieldRing.setVisible(false);
  }

  createHud() {
    this.scoreText = this.add.text(12, 12, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setDepth(200);

    this.livesText = this.add.text(12, 34, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff"
    }).setDepth(200);

    this.waveText = this.add.text(12, 56, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#cceaff"
    }).setDepth(200);

    this.powerText = this.add.text(12, 78, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ffe891",
      wordWrap: { width: 310 }
    }).setDepth(200);

    this.statsText = this.add.text(this.W() - 12, 12, "", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#ffffff",
      align: "right"
    }).setOrigin(1, 0).setDepth(200);

    this.bossBarBack = this.add.rectangle(this.W() / 2, 132, 315, 18, 0x240915, 0.9);
    this.bossBarBack.setDepth(201);
    this.bossBarBack.setVisible(false);

    this.bossBarFill = this.add.rectangle(this.W() / 2 - 157.5, 132, 315, 18, 0x54ff8c, 1);
    this.bossBarFill.setOrigin(0, 0.5);
    this.bossBarFill.setDepth(202);
    this.bossBarFill.setVisible(false);

    this.bossText = this.add.text(this.W() / 2, 155, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(202);

    this.bossText.setVisible(false);
  }

  createControls() {
    this.joyBase = this.add.circle(82, this.H() - 108, 58, 0x0b2b57, 0.30);
    this.joyBase.setStrokeStyle(3, 0x9fe0ff, 0.65);
    this.joyBase.setDepth(300);

    this.joyKnob = this.add.circle(82, this.H() - 108, 24, 0x8bddff, 0.55);
    this.joyKnob.setStrokeStyle(2, 0xffffff, 0.9);
    this.joyKnob.setDepth(301);

    this.shootButton = this.add.circle(this.W() - 76, this.H() - 112, 54, 0x165bd6, 0.38);
    this.shootButton.setStrokeStyle(3, 0xffffff, 0.85);
    this.shootButton.setDepth(300);

    this.shootLabel = this.add.text(this.W() - 76, this.H() - 112, "SKYD", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(301);

    this.superButton = this.add.circle(this.W() - 76, this.H() - 232, 38, 0xffd15c, 0.32);
    this.superButton.setStrokeStyle(3, 0xffffff, 0.75);
    this.superButton.setDepth(300);

    this.superLabel = this.add.text(this.W() - 76, this.H() - 232, "SUPER", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(301);

    this.pauseButton = this.add.circle(this.W() - 30, 48, 19, 0x0b2b57, 0.65);
    this.pauseButton.setStrokeStyle(2, 0xffffff, 0.8);
    this.pauseButton.setDepth(310);

    this.pauseLabel = this.add.text(this.W() - 30, 48, "II", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(311);

    this.layoutControls();
  }

  layoutControls() {
    const w = this.W();
    const h = this.H();

    this.joyBaseX = 82;
    this.joyBaseY = h - 108;

    this.shootX = w - 76;
    this.shootY = h - 112;

    this.superX = w - 76;
    this.superY = h - 232;

    this.pauseX = w - 30;
    this.pauseY = 48;

    if (this.joyBase) this.joyBase.setPosition(this.joyBaseX, this.joyBaseY);
    if (this.joyKnob && this.joystickTouchId === null) this.joyKnob.setPosition(this.joyBaseX, this.joyBaseY);

    if (this.shootButton) this.shootButton.setPosition(this.shootX, this.shootY);
    if (this.shootLabel) this.shootLabel.setPosition(this.shootX, this.shootY);

    if (this.superButton) this.superButton.setPosition(this.superX, this.superY);
    if (this.superLabel) this.superLabel.setPosition(this.superX, this.superY);

    if (this.pauseButton) this.pauseButton.setPosition(this.pauseX, this.pauseY);
    if (this.pauseLabel) this.pauseLabel.setPosition(this.pauseX, this.pauseY);

    if (this.statsText) this.statsText.setPosition(w - 12, 12);

    if (this.bossBarBack) this.bossBarBack.setPosition(w / 2, 132);
    if (this.bossBarFill) this.bossBarFill.setPosition(w / 2 - 157.5, 132);
    if (this.bossText) this.bossText.setPosition(w / 2, 155);
  }

  installNativeTouchControls() {
    const canvas = this.sys.game.canvas;

    const block = function (event) {
      event.preventDefault();
    };

    canvas.addEventListener("touchstart", (event) => this.onNativeTouchStart(event), { passive: false });
    canvas.addEventListener("touchmove", (event) => this.onNativeTouchMove(event), { passive: false });
    canvas.addEventListener("touchend", (event) => this.onNativeTouchEnd(event), { passive: false });
    canvas.addEventListener("touchcancel", (event) => this.onNativeTouchEnd(event), { passive: false });

    document.addEventListener("gesturestart", block, { passive: false });
    document.addEventListener("gesturechange", block, { passive: false });
    document.addEventListener("gestureend", block, { passive: false });
  }

  getTouchPoint(touch) {
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();

    return {
      id: touch.identifier,
      x: (touch.clientX - rect.left) * (this.W() / rect.width),
      y: (touch.clientY - rect.top) * (this.H() / rect.height)
    };
  }

  onNativeTouchStart(event) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
      const p = this.getTouchPoint(touch);
      this.handleTouchStart(p);
    }
  }

  onNativeTouchMove(event) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
      const p = this.getTouchPoint(touch);
      this.handleTouchMove(p);
    }
  }

  onNativeTouchEnd(event) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
      const p = this.getTouchPoint(touch);
      this.handleTouchEnd(p);
    }
  }

  handleTouchStart(pointer) {
    if (this.isInsideCircle(pointer.x, pointer.y, this.pauseX, this.pauseY, 36)) {
      if (this.gameState === "playing") this.pauseGame();
      else if (this.gameState === "paused") this.resumeGame();
      return;
    }

    if (this.gameState !== "playing") return;

    if (this.isInsideCircle(pointer.x, pointer.y, this.joyBaseX, this.joyBaseY, 92)) {
      this.joystickTouchId = pointer.id;
      this.updateJoystick(pointer);
      return;
    }

    if (this.isInsideCircle(pointer.x, pointer.y, this.shootX, this.shootY, 82)) {
      this.shootTouchIds.add(pointer.id);
      this.shootHeld = true;
      if (this.shootButton) this.shootButton.setScale(0.94);
      return;
    }

    if (this.isInsideCircle(pointer.x, pointer.y, this.superX, this.superY, 62)) {
      this.superTouchIds.add(pointer.id);
      if (this.superButton) this.superButton.setScale(0.94);
      this.useSuper();
    }
  }

  handleTouchMove(pointer) {
    if (this.gameState !== "playing") return;

    if (pointer.id === this.joystickTouchId) {
      this.updateJoystick(pointer);
    }
  }

  handleTouchEnd(pointer) {
    if (pointer.id === this.joystickTouchId) {
      this.resetJoystick();
    }

    if (this.shootTouchIds.has(pointer.id)) {
      this.shootTouchIds.delete(pointer.id);

      if (this.shootTouchIds.size === 0 && !this.keyboardShootHeld) {
        this.shootHeld = false;
      }

      if (this.shootButton) this.shootButton.setScale(this.shootTouchIds.size > 0 ? 0.94 : 1);
    }

    if (this.superTouchIds.has(pointer.id)) {
      this.superTouchIds.delete(pointer.id);
      if (this.superButton) this.superButton.setScale(this.superTouchIds.size > 0 ? 0.94 : 1);
    }
  }

  releaseAllTouches() {
    this.joystickTouchId = null;
    this.joystickValue = 0;

    this.shootTouchIds.clear();
    this.superTouchIds.clear();

    this.shootHeld = false;
    this.keyboardShootHeld = false;

    if (this.joyKnob) this.joyKnob.setPosition(this.joyBaseX, this.joyBaseY);
    if (this.shootButton) this.shootButton.setScale(1);
    if (this.superButton) this.superButton.setScale(1);
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joyBaseX;
    const dy = pointer.y - this.joyBaseY;

    const maxDist = 40;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(distance, maxDist);
    const angle = Math.atan2(dy, dx);

    this.joyKnob.x = this.joyBaseX + Math.cos(angle) * clamped;
    this.joyKnob.y = this.joyBaseY + Math.sin(angle) * clamped;

    this.joystickValue = Phaser.Math.Clamp(dx / maxDist, -1, 1);
  }

  resetJoystick() {
    this.joystickTouchId = null;
    this.joystickValue = 0;

    if (this.joyKnob) {
      this.joyKnob.setPosition(this.joyBaseX, this.joyBaseY);
    }
  }

  isInsideCircle(x, y, cx, cy, radius) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= radius * radius;
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

    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.hazards, this.playerHit, null, this);

    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
  }

  handleResize() {
    const w = this.W();
    const h = this.H();

    this.cameras.main.setSize(w, h);
    this.physics.world.setBounds(0, 0, w, h);

    this.layoutBackground();
    this.layoutControls();

    if (this.player) {
      this.player.setCollideWorldBounds(true);
      this.player.x = Phaser.Math.Clamp(this.player.x, 40, w - 40);

      if (this.gameState === "menu") {
        this.player.setPosition(w / 2, h - 185);
      }
    }
  }

  showStartMenu() {
    this.gameState = "menu";
    this.physics.pause();

    if (this.menuContainer) this.menuContainer.destroy(true);

    this.menuContainer = this.add.container(0, 0).setDepth(600);

    const w = this.W();
    const h = this.H();

    const panel = this.add.rectangle(w / 2, h / 2, Math.min(420, w - 28), 540, 0x000000, 0.76);
    panel.setStrokeStyle(3, 0x7ed6ff, 0.45);

    const title = this.add.text(w / 2, h / 2 - 185, "MARVIN\nMOD VERDEN", {
      fontFamily: "Arial",
      fontSize: "36px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      lineSpacing: -8
    }).setOrigin(0.5);

    const sub = this.add.text(w / 2, h / 2 - 92, "Mobilspil på Tved Stadion", {
      fontFamily: "Arial",
      fontSize: "17px",
      color: "#bee4ff",
      align: "center"
    }).setOrigin(0.5);

    const statText = this.add.text(w / 2, h / 2 - 22, `Highscore: ${this.highScore}\nSejre: ${this.totalWins}`, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffe891",
      align: "center",
      lineSpacing: 5
    }).setOrigin(0.5);

    const startButton = this.makeButton(w / 2, h / 2 + 88, 230, 50, "START SPIL");
    startButton.bg.on("pointerdown", () => this.startGame());

    const howButton = this.makeButton(w / 2, h / 2 + 154, 250, 46, "SÅDAN SPILLER DU");
    howButton.bg.on("pointerdown", () => this.showHowTo());

    this.menuContainer.add([
      panel,
      title,
      sub,
      statText,
      startButton.bg,
      startButton.label,
      howButton.bg,
      howButton.label
    ]);
  }

  showHowTo() {
    if (this.howToContainer) this.howToContainer.destroy(true);

    const w = this.W();
    const h = this.H();

    this.howToContainer = this.add.container(0, 0).setDepth(650);

    const panel = this.add.rectangle(w / 2, h / 2, Math.min(420, w - 28), 500, 0x02101f, 0.94);
    panel.setStrokeStyle(2, 0x8bd8ff, 0.65);

    const title = this.add.text(w / 2, h / 2 - 180, "SÅDAN SPILLER DU", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const body = this.add.text(w / 2, h / 2 - 20,
      "• Venstre finger: joystick.\n\n" +
      "• Højre finger: hold SKYD nede.\n\n" +
      "• SUPER-knappen er over skydeknappen.\n\n" +
      "• Du kan bevæge dig og skyde samtidig.\n\n" +
      "• Saml powerups og besejr alle bosser.",
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#dcecff",
        wordWrap: { width: Math.min(340, w - 70) },
        lineSpacing: 6
      }
    ).setOrigin(0.5);

    const close = this.makeButton(w / 2, h / 2 + 190, 150, 44, "LUK");
    close.bg.on("pointerdown", () => {
      this.howToContainer.destroy(true);
      this.howToContainer = null;
    });

    this.howToContainer.add([panel, title, body, close.bg, close.label]);
  }

  makeButton(x, y, w, h, text) {
    const bg = this.add.rectangle(x, y, w, h, 0xffffff, 1);
    bg.setInteractive();

    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#06214c",
      fontStyle: "bold"
    }).setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(0xdff3ff));
    bg.on("pointerout", () => bg.setFillStyle(0xffffff));

    return { bg, label };
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

    this.clearAllObjects();
    this.releaseAllTouches();

    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.wave = 0;
    this.hitsTaken = 0;

    this.lastShotAt = 0;
    this.doubleLaserUntil = 0;
    this.slowMotionUntil = 0;
    this.invincibleUntil = 0;
    this.shieldActive = false;

    this.superReady = true;
    this.superCooldownUntil = 0;

    this.boss = null;
    this.bossActive = false;
    this.waitingForNextWave = false;

    this.player.setPosition(this.W() / 2, this.H() - 185);
    this.player.setVelocity(0, 0);
    this.player.setActive(true);
    this.player.setVisible(true);
    this.player.setAlpha(1);
    this.player.clearTint();

    this.gameState = "playing";
    this.physics.resume();

    this.showCenterMessage("MARVIN MOD VERDEN", "Tved Stadion er klar!", 1300);

    this.time.delayedCall(900, () => {
      if (this.gameState === "playing") this.startNextWave();
    });
  }

  clearAllObjects() {
    [
      this.playerBullets,
      this.enemyBullets,
      this.enemies,
      this.powerups,
      this.hazards,
      this.bossGroup
    ].forEach((group) => {
      if (group) group.clear(true, true);
    });

    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }

    if (this.bossAura) {
      this.bossAura.destroy();
      this.bossAura = null;
    }

    this.setBossUi(false);
  }

  pauseGame() {
    if (this.gameState !== "playing") return;

    this.gameState = "paused";
    this.physics.pause();

    this.pauseContainer = this.add.container(0, 0).setDepth(700);

    const panel = this.add.rectangle(this.W() / 2, this.H() / 2, 360, 190, 0x000000, 0.82);

    const text = this.add.text(this.W() / 2, this.H() / 2, "PAUSE\nTryk II", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

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

    this.handleKeyboard(time);
    this.updatePlayer(time);
    this.updateEnemies(time, delta);
    this.updateBoss(time, delta);
    this.cleanupObjects();
    this.updateHud();

    if (!this.bossActive && !this.waitingForNextWave && this.enemies.countActive(true) === 0) {
      this.waitingForNextWave = true;

      this.time.delayedCall(850, () => {
        if (this.gameState === "playing") this.startNextWave();
      });
    }
  }

  updateBackground(delta) {
    this.stars.forEach((star) => {
      star.y += star.speed * delta / 1000;

      if (star.y > this.H()) {
        star.y = -5;
        star.x = Phaser.Math.Between(0, this.W());
      }
    });
  }

  handleKeyboard() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.useSuper();
    }

    this.keyboardShootHeld = this.keys.SPACE.isDown;
    this.shootHeld = this.keyboardShootHeld || this.shootTouchIds.size > 0;
  }

  updatePlayer(time) {
    let move = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) move = -1;
    if (this.cursors.right.isDown || this.keys.D.isDown) move = 1;

    if (Math.abs(this.joystickValue) > 0.05) {
      move = this.joystickValue;
    }

    let speed = 315;

    if (time < this.slowMotionUntil) {
      speed = 230;
    }

    this.player.setVelocityX(move * speed);

    if (this.shootHeld) {
      this.shoot(time);
    }

    if (time < this.invincibleUntil) {
      this.player.setAlpha(Math.floor(time / 85) % 2 === 0 ? 0.45 : 1);
    } else {
      this.player.setAlpha(1);
    }

    this.shieldRing.setPosition(this.player.x, this.player.y);
    this.shieldRing.setVisible(this.shieldActive);

    if (this.shieldActive) {
      this.shieldRing.rotation += 0.04;
    }
  }

  shoot(time) {
    const fireRate = time < this.doubleLaserUntil ? 95 : 150;

    if (time - this.lastShotAt < fireRate) return;

    this.lastShotAt = time;

    if (time < this.doubleLaserUntil) {
      this.spawnPlayerBullet(this.player.x - 12, this.player.y - 40);
      this.spawnPlayerBullet(this.player.x + 12, this.player.y - 40);
    } else {
      this.spawnPlayerBullet(this.player.x, this.player.y - 42);
    }

    this.beep(720, 0.025, "square", 0.018);
  }

  spawnPlayerBullet(x, y) {
    const laser = this.add.rectangle(x, y, 4, 34, 0xd9fbff, 1);
    laser.setDepth(26);

    const glow = this.add.rectangle(x, y, 12, 40, 0x6beeff, 0.18);
    glow.setDepth(25);

    laser.glow = glow;

    this.physics.add.existing(laser);
    laser.body.setAllowGravity(false);
    laser.body.setSize(6, 36);
    laser.body.setVelocity(0, -820);

    this.playerBullets.add(laser);
  }

  startNextWave() {
    if (this.gameState !== "playing") return;

    this.waitingForNextWave = false;
    this.wave += 1;

    if (this.wave > 3) {
      this.startBoss();
      return;
    }

    const waveNames = {
      1: "T-BORG BOLDE",
      2: "DISCO PRES",
      3: "STADION STORM"
    };

    this.showCenterMessage(`LEVEL ${this.level} · WAVE ${this.wave}`, waveNames[this.wave], 1000);

    const cols = 6;
    const rows = this.wave === 1 ? 2 : 3;
    const gapX = Math.min(62, this.W() / 7.2);
    const startX = this.W() / 2 - ((cols - 1) * gapX) / 2;
    const startY = 185;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = "normal";

        if ((r + c + this.level + this.wave) % 5 === 0) type = "shooter";
        else if ((r + c) % 3 === 0) type = "wobbler";

        this.spawnEnemy(startX + c * gapX, startY + r * 58, type);
      }
    }
  }

  getEnemyTexture() {
    if (this.level === 1) {
      return this.textures.exists("enemyBallClassic") ? "enemyBallClassic" : "fallbackBall";
    }

    if (this.level === 2) {
      return this.textures.exists("enemyBallDisco") ? "enemyBallDisco" : "fallbackBall";
    }

    return this.textures.exists("enemyBallBlue") ? "enemyBallBlue" : "fallbackBall";
  }

  spawnEnemy(x, y, type) {
    const enemy = this.physics.add.sprite(x, y, this.getEnemyTexture());

    enemy.setDepth(15);
    enemy.displayWidth = type === "shooter" ? 43 : 40;
    enemy.scaleY = enemy.scaleX;

    enemy.type = type;
    enemy.hp = type === "normal" ? 1 : type === "wobbler" ? 2 : 3;
    enemy.scoreValue = type === "normal" ? 100 : type === "wobbler" ? 200 : 300;

    enemy.baseX = x;
    enemy.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    enemy.waveOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    enemy.lastShotAt = this.time.now + Phaser.Math.Between(300, 1300);

    enemy.body.setAllowGravity(false);
    enemy.body.setSize(enemy.width * 0.68, enemy.height * 0.68, true);

    this.enemies.add(enemy);
  }

  updateEnemies(time, delta) {
    const slow = time < this.slowMotionUntil ? 0.55 : 1;

    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;

      if (enemy.type === "normal") {
        enemy.x += enemy.direction * (38 + this.level * 7) * slow * delta / 1000;
        enemy.y += 12 * slow * delta / 1000;

        if (enemy.x < 32 || enemy.x > this.W() - 32) {
          enemy.direction *= -1;
          enemy.y += 16;
        }
      }

      if (enemy.type === "wobbler") {
        enemy.x = enemy.baseX + Math.sin(time / 280 + enemy.waveOffset) * 45;
        enemy.y += (29 + this.level * 4) * slow * delta / 1000;
      }

      if (enemy.type === "shooter") {
        enemy.x = enemy.baseX + Math.sin(time / 460 + enemy.waveOffset) * 31;
        enemy.y += (17 + this.level * 3) * slow * delta / 1000;

        if (time - enemy.lastShotAt > 1450 - this.level * 90) {
          enemy.lastShotAt = time;
          this.spawnEnemyBullet(enemy.x, enemy.y + 24, 0, 230, 0xffffff, 6);
        }
      }

      enemy.rotation += 0.045 * slow;

      if (enemy.y > this.H() - 190) {
        this.playerHit(this.player, enemy);
      }
    });
  }

  spawnEnemyBullet(x, y, vx, vy, color, radius) {
    const bullet = this.add.circle(x, y, radius, color, 0.90);
    bullet.setDepth(16);

    this.physics.add.existing(bullet);
    bullet.body.setAllowGravity(false);
    bullet.body.setCircle(radius);
    bullet.body.setVelocity(vx, vy);

    this.enemyBullets.add(bullet);
  }

  playerBulletHitsEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;

    this.destroyPlayerBullet(bullet);

    enemy.hp -= 1;
    enemy.setTint(0xffffff);

    this.time.delayedCall(55, () => {
      if (enemy && enemy.active) enemy.clearTint();
    });

    if (enemy.hp <= 0) {
      this.addScore(enemy.scoreValue);
      this.spawnExplosion(enemy.x, enemy.y, 0xffffff, 9);
      this.dropPowerupMaybe(enemy.x, enemy.y);
      enemy.destroy();
    }
  }

  destroyPlayerBullet(bullet) {
    if (bullet.glow && bullet.glow.active) {
      bullet.glow.destroy();
    }

    if (bullet.active) {
      bullet.destroy();
    }
  }

  dropPowerupMaybe(x, y) {
    const roll = Math.random();

    if (roll > 0.16) return;

    let type = "double";

    if (roll > 0.06 && roll <= 0.11) type = "shield";
    if (roll > 0.11) type = "slow";

    const color = type === "double" ? 0x79e7ff : type === "shield" ? 0x69ff9c : 0xffe36a;
    const label = type === "double" ? "2X" : type === "shield" ? "TB" : "FL";

    const drop = this.add.circle(x, y, 15, color, 0.95);
    drop.setDepth(18);
    drop.powerType = type;

    this.physics.add.existing(drop);
    drop.body.setAllowGravity(false);
    drop.body.setCircle(15);
    drop.body.setVelocity(0, 125);

    this.powerups.add(drop);

    const text = this.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#06214c",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(19);

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
      this.showToast("DOMMERFLØJTE! FJENDERNE BLIVER LANGSOMME");
    }

    drop.destroy();
    this.beep(940, 0.08, "sine", 0.04);
  }

  startBoss() {
    if (this.gameState !== "playing") return;

    this.bossActive = true;
    this.enemies.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.hazards.clear(true, true);

    const data = this.getBossData();

    this.bossName = data.name;
    this.bossMaxHp = data.hp;
    this.bossHp = data.hp;
    this.bossColor = data.color;

    this.showCenterMessage(data.title, data.intro, 1650);

    this.time.delayedCall(1000, () => {
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
        color: 0x6cff8e,
        width: 220
      };
    }

    if (this.level === 2) {
      return {
        key: this.textures.exists("frisko") ? "frisko" : "fallbackBoss",
        name: "FRISKO-DASKO",
        title: "BOSS: FRISKO-DASKO",
        intro: "Frisko-Dasko tænder stadion-discoen!",
        hp: 120,
        color: 0xff7be8,
        width: 220
      };
    }

    return {
      key: this.textures.exists("michael") ? "michael" : "fallbackBoss",
      name: "MICHAELS CYKELSME'",
      title: "FINAL BOSS: MICHAELS CYKELSME'",
      intro: "Michaels Cykelsme' ruller ind med fuld gaz!",
      hp: 150,
      color: 0x9fe8ff,
      width: 215
    };
  }

  spawnBoss(data) {
    this.bossAura = this.add.circle(this.W() / 2, 215, 96, data.color, 0.14);
    this.bossAura.setStrokeStyle(4, data.color, 0.6);
    this.bossAura.setDepth(12);

    this.boss = this.physics.add.sprite(this.W() / 2, 215, data.key);
    this.boss.setDepth(17);
    this.boss.displayWidth = data.width;
    this.boss.scaleY = this.boss.scaleX;

    this.boss.body.setAllowGravity(false);
    this.boss.body.setImmovable(true);
    this.boss.body.setSize(this.boss.width * 0.55, this.boss.height * 0.58, true);

    this.bossGroup.add(this.boss);

    this.bossLastAttack = 0;
    this.bossLastSpecial = 0;
    this.bossLastMinion = 0;

    this.setBossUi(true, data.name, data.color);
  }

  updateBoss(time) {
    if (!this.bossActive || !this.boss || !this.boss.active) return;

    const hpPercent = this.bossHp / this.bossMaxHp;
    const phaseSpeed = hpPercent < 0.3 ? 1.45 : hpPercent < 0.6 ? 1.22 : 1;
    const slow = time < this.slowMotionUntil ? 0.65 : 1;

    if (this.level === 1) {
      this.boss.x = this.W() / 2 + Math.sin(time / 760) * Math.min(108, this.W() * 0.22);
      this.boss.y = 215 + Math.sin(time / 420) * 11;

      if (time - this.bossLastAttack > 950 / phaseSpeed) {
        this.bossLastAttack = time;
        this.spawnEnemyBullet(this.boss.x - 22, this.boss.y + 55, -35, 245 * slow, 0x66ff8e, 8);
        this.spawnEnemyBullet(this.boss.x + 22, this.boss.y + 55, 35, 245 * slow, 0x66ff8e, 8);
      }

      if (time - this.bossLastSpecial > 2600 / phaseSpeed) {
        this.bossLastSpecial = time;
        this.spawnWarningBeam(this.boss.x, 0x66ff8e);
      }
    }

    if (this.level === 2) {
      this.boss.x = this.W() / 2 + Math.sin(time / 360) * Math.min(125, this.W() * 0.25);
      this.boss.y = 215 + Math.cos(time / 540) * 24;
      this.boss.rotation = Math.sin(time / 300) * 0.06;

      if (time - this.bossLastAttack > 760 / phaseSpeed) {
        this.bossLastAttack = time;

        for (let i = -2; i <= 2; i++) {
          this.spawnEnemyBullet(this.boss.x, this.boss.y + 55, i * 48, 228 * slow, 0xff80e7, 7);
        }
      }

      if (time - this.bossLastSpecial > 2450 / phaseSpeed) {
        this.bossLastSpecial = time;
        this.spawnDiscoRing(this.boss.x, this.boss.y + 75);
      }
    }

    if (this.level === 3) {
      this.boss.x = this.W() / 2 + Math.sin(time / 640) * Math.min(95, this.W() * 0.20);
      this.boss.y = 218 + Math.sin(time / 400) * 10;

      if (time - this.bossLastAttack > 860 / phaseSpeed) {
        this.bossLastAttack = time;

        this.spawnEnemyBullet(this.boss.x - 34, this.boss.y + 58, -70, 245 * slow, 0x9fe8ff, 8);
        this.spawnEnemyBullet(this.boss.x + 34, this.boss.y + 58, 70, 245 * slow, 0x9fe8ff, 8);
        this.spawnWheelEnemyBullet(this.boss.x + Phaser.Math.Between(-70, 70), this.boss.y + 65);
      }

      if (time - this.bossLastSpecial > 2800 / phaseSpeed) {
        this.bossLastSpecial = time;
        this.spawnOilPatch(Phaser.Math.Between(70, this.W() - 70), this.H() - 250);
      }
    }

    this.bossAura.setPosition(this.boss.x, this.boss.y);
    this.bossAura.setAlpha(0.12 + Math.abs(Math.sin(time / 260)) * 0.13);

    this.bossBarFill.width = Phaser.Math.Clamp((this.bossHp / this.bossMaxHp) * 315, 0, 315);
  }

  spawnWarningBeam(x, color) {
    const warning = this.add.rectangle(x, this.H() / 2, 30, this.H(), color, 0.10);
    warning.setDepth(14);

    this.tweens.add({
      targets: warning,
      alpha: { from: 0.10, to: 0.28 },
      duration: 140,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warning.destroy();

        const beam = this.add.rectangle(x, this.H() / 2, 24, this.H(), color, 0.34);
        beam.setDepth(16);

        this.physics.add.existing(beam);
        beam.body.setAllowGravity(false);
        beam.body.setSize(24, this.H());

        this.enemyBullets.add(beam);

        this.time.delayedCall(420, () => {
          if (beam.active) beam.destroy();
        });
      }
    });
  }

  spawnDiscoRing(x, y) {
    const ring = this.add.circle(x, y, 18, 0xff80e7, 0.12);
    ring.setStrokeStyle(4, 0xff80e7, 0.85);
    ring.setDepth(16);

    this.physics.add.existing(ring);
    ring.body.setAllowGravity(false);
    ring.body.setCircle(18);

    this.enemyBullets.add(ring);

    this.tweens.add({
      targets: ring,
      scale: 4.2,
      alpha: 0,
      duration: 650,
      onUpdate: () => {
        if (ring.body) ring.body.setCircle(18 * ring.scaleX);
      },
      onComplete: () => {
        if (ring.active) ring.destroy();
      }
    });
  }

  spawnWheelEnemyBullet(x, y) {
    const key = this.textures.exists("enemyBallBlue") ? "enemyBallBlue" : "fallbackBall";

    const ball = this.physics.add.sprite(x, y, key);
    ball.setDepth(16);
    ball.displayWidth = 46;
    ball.scaleY = ball.scaleX;

    ball.body.setAllowGravity(false);
    ball.body.setVelocity(0, 260);
    ball.rotationSpeed = 0.16;

    ball.customUpdate = () => {
      ball.rotation += ball.rotationSpeed;
    };

    this.enemyBullets.add(ball);
  }

  spawnOilPatch(x, y) {
    const patch = this.add.ellipse(x, y, 96, 32, 0x061019, 0.82);
    patch.setStrokeStyle(2, 0x9fe8ff, 0.28);
    patch.setDepth(13);
    patch.hazardType = "oil";

    this.physics.add.existing(patch);
    patch.body.setAllowGravity(false);
    patch.body.setSize(96, 32);

    this.hazards.add(patch);

    this.time.delayedCall(3600, () => {
      if (patch.active) patch.destroy();
    });
  }

  playerBulletHitsBoss(bullet) {
    if (!this.bossActive || !this.boss || !this.boss.active) return;

    this.destroyPlayerBullet(bullet);

    this.bossHp -= this.time.now < this.doubleLaserUntil ? 1.15 : 1;

    this.boss.setTint(0xffffff);

    this.time.delayedCall(45, () => {
      if (this.boss && this.boss.active) this.boss.clearTint();
    });

    if (this.bossHp <= 0) {
      this.defeatBoss();
    }
  }

  defeatBoss() {
    if (!this.boss) return;

    const x = this.boss.x;
    const y = this.boss.y;

    this.spawnExplosion(x, y, this.bossColor, 26);
    this.cameras.main.shake(250, 0.018);
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
      this.showCenterMessage("SEJR!", "Marvin slog hele verden!", 1600);

      this.time.delayedCall(1700, () => this.finishGame(true));
    } else {
      this.showCenterMessage(`${this.bossName} ER NEDE!`, "Næste level starter...", 1500);

      this.level += 1;
      this.wave = 0;

      this.time.delayedCall(1700, () => {
        if (this.gameState === "playing") this.startNextWave();
      });
    }
  }

  playerHit(player, danger) {
    if (this.gameState !== "playing") return;
    if (this.time.now < this.invincibleUntil) return;

    if (danger && danger.hazardType === "oil") {
      this.slowMotionUntil = this.time.now + 2200;
      this.showToast("OLIE PÅ BANEN! MARVIN BLIVER LANGSOM");
      return;
    }

    if (danger && danger.destroy) {
      danger.destroy();
    }

    if (this.shieldActive) {
      this.shieldActive = false;
      this.invincibleUntil = this.time.now + 900;
      this.showToast("TB-SKJOLD BLOKEREDE!");
      this.beep(260, 0.08, "sine", 0.05);
      return;
    }

    this.lives -= 1;
    this.hitsTaken += 1;
    this.invincibleUntil = this.time.now + 1500;

    this.cameras.main.shake(150, 0.012);
    this.beep(100, 0.18, "sawtooth", 0.07);
    this.showToast("AV! MARVIN TOG ET HIT");

    if (this.lives <= 0) {
      this.finishGame(false);
    }
  }

  useSuper() {
    if (!this.superReady || this.gameState !== "playing") return;

    this.superReady = false;
    this.superCooldownUntil = this.time.now + 8500;

    this.showCenterMessage("SUPER: STADIONLYS!", "Hele banen blinker!", 800);
    this.beep(1040, 0.12, "square", 0.045);

    const pulse = this.add.circle(this.player.x, this.player.y, 40, 0x79e3ff, 0.35);
    pulse.setDepth(60);

    this.tweens.add({
      targets: pulse,
      scale: 11,
      alpha: 0,
      duration: 420,
      onComplete: () => pulse.destroy()
    });

    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;

      this.addScore(enemy.scoreValue);
      this.spawnExplosion(enemy.x, enemy.y, 0x79e3ff, 8);
      enemy.destroy();
    });

    this.enemyBullets.clear(true, true);

    if (this.bossActive) {
      this.bossHp -= 10;
      if (this.bossHp <= 0) this.defeatBoss();
    }
  }

  addScore(points) {
    this.score += points;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("marvin_mod_verden_highscore", String(this.highScore));
    }
  }

  spawnExplosion(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i++) {
      const piece = this.add.rectangle(
        x,
        y,
        Phaser.Math.Between(3, 8),
        Phaser.Math.Between(3, 8),
        color,
        1
      );

      piece.setDepth(40);

      this.tweens.add({
        targets: piece,
        x: x + Phaser.Math.Between(-60, 60),
        y: y + Phaser.Math.Between(-60, 60),
        alpha: 0,
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(260, 680),
        onComplete: () => piece.destroy()
      });
    }
  }

  showToast(text) {
    const toast = this.add.text(this.W() / 2, 174, text, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
      backgroundColor: "#000000aa",
      padding: { x: 10, y: 6 },
      align: "center"
    }).setOrigin(0.5).setDepth(500);

    this.tweens.add({
      targets: toast,
      y: 148,
      alpha: 0,
      duration: 1400,
      onComplete: () => toast.destroy()
    });
  }

  showCenterMessage(title, subtitle, duration) {
    if (this.centerMessage) {
      this.centerMessage.destroy(true);
      this.centerMessage = null;
    }

    const box = this.add.container(0, 0).setDepth(550);

    const panel = this.add.rectangle(this.W() / 2, this.H() / 2, Math.min(420, this.W() - 28), 150, 0x000000, 0.65);
    panel.setStrokeStyle(2, 0x82d8ff, 0.28);

    const titleText = this.add.text(this.W() / 2, this.H() / 2 - 25, title, {
      fontFamily: "Arial",
      fontSize: "25px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: Math.min(380, this.W() - 40) }
    }).setOrigin(0.5);

    const subText = this.add.text(this.W() / 2, this.H() / 2 + 25, subtitle, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#bee4ff",
      align: "center",
      wordWrap: { width: Math.min(360, this.W() - 40) }
    }).setOrigin(0.5);

    box.add([panel, titleText, subText]);
    this.centerMessage = box;

    this.time.delayedCall(duration, () => {
      if (this.centerMessage === box) {
        this.centerMessage = null;
      }

      box.destroy(true);
    });
  }

  setBossUi(visible, name = "", color = 0xffffff) {
    this.bossBarBack.setVisible(visible);
    this.bossBarFill.setVisible(visible);
    this.bossText.setVisible(visible);

    if (visible) {
      this.bossBarFill.setFillStyle(color, 1);
      this.bossBarFill.width = 315;
      this.bossText.setText(name);
    }
  }

  updateHud() {
    if (!this.superReady && this.time.now >= this.superCooldownUntil && this.gameState === "playing") {
      this.superReady = true;
      this.showToast("SUPER ER KLAR IGEN");
    }

    const doubleLeft = Math.max(0, Math.ceil((this.doubleLaserUntil - this.time.now) / 1000));
    const slowLeft = Math.max(0, Math.ceil((this.slowMotionUntil - this.time.now) / 1000));

    let power = `Skjold: ${this.shieldActive ? "ON" : "OFF"} · SUPER: ${this.superReady ? "KLAR" : "LADER"}`;

    if (doubleLeft > 0) power += `\n2X Laser: ${doubleLeft}s`;
    if (slowLeft > 0) power += ` · Fløjte: ${slowLeft}s`;

    this.scoreText.setText(`Score: ${this.score}`);
    this.livesText.setText(`Lives: ${"♥".repeat(Math.max(0, this.lives))}`);
    this.waveText.setText(`Level ${this.level}${this.bossActive ? " · Bosskamp" : ` · Wave ${Math.max(1, this.wave)}`}`);
    this.powerText.setText(power);
    this.statsText.setText(`High: ${this.highScore}`);
  }

  finishGame(won) {
    if (this.gameState !== "playing") return;

    this.gameState = won ? "victory" : "gameover";
    this.physics.pause();

    if (won) {
      this.totalWins += 1;
      localStorage.setItem("marvin_mod_verden_wins", String(this.totalWins));
    }

    this.showEndScreen(won);
  }

  showEndScreen(won) {
    if (this.endContainer) this.endContainer.destroy(true);

    this.endContainer = this.add.container(0, 0).setDepth(750);

    const panel = this.add.rectangle(this.W() / 2, this.H() / 2, Math.min(420, this.W() - 28), 330, 0x000000, 0.83);
    panel.setStrokeStyle(3, 0x85dfff, 0.35);

    const heading = this.add.text(this.W() / 2, this.H() / 2 - 105, won ? "SEJR!" : "GAME OVER", {
      fontFamily: "Arial",
      fontSize: "38px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const subtitle = this.add.text(
      this.W() / 2,
      this.H() / 2 - 52,
      won ? "Marvin slog hele verden på Tved Stadion!" : "Verden vandt denne gang.",
      {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#bee4ff",
        align: "center",
        wordWrap: { width: Math.min(360, this.W() - 40) }
      }
    ).setOrigin(0.5);

    const stats = this.add.text(
      this.W() / 2,
      this.H() / 2 + 28,
      `Score: ${this.score}\nHits taget: ${this.hitsTaken}\nHighscore: ${this.highScore}`,
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffe891",
        align: "center",
        lineSpacing: 5
      }
    ).setOrigin(0.5);

    const restart = this.makeButton(this.W() / 2, this.H() / 2 + 120, 180, 44, "SPIL IGEN");
    restart.bg.on("pointerdown", () => this.startGame());

    const menu = this.makeButton(this.W() / 2, this.H() / 2 + 174, 180, 44, "MENU");
    menu.bg.on("pointerdown", () => {
      this.endContainer.destroy(true);
      this.endContainer = null;
      this.showStartMenu();
    });

    this.endContainer.add([panel, heading, subtitle, stats, restart.bg, restart.label, menu.bg, menu.label]);
  }

  cleanupObjects() {
    const groups = [this.playerBullets, this.enemyBullets, this.powerups];

    groups.forEach((group) => {
      group.children.iterate((obj) => {
        if (!obj || !obj.active) return;

        if (obj.customUpdate) obj.customUpdate();

        if (obj.glow && obj.glow.active) {
          obj.glow.setPosition(obj.x, obj.y);
        }

        if (obj.y < -180 || obj.y > this.H() + 180 || obj.x < -180 || obj.x > this.W() + 180) {
          if (obj.glow && obj.glow.active) obj.glow.destroy();
          obj.destroy();
        }
      });
    });

    this.children.list.forEach((child) => {
      if (!child.followTarget) return;

      if (child.followTarget.active) {
        child.setPosition(child.followTarget.x, child.followTarget.y);
      } else {
        child.destroy();
      }
    });
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  beep(freq, duration, type, volume) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

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
    } catch (error) {}
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",

  width: window.innerWidth,
  height: window.visualViewport ? window.visualViewport.height : window.innerHeight,

  backgroundColor: "#041127",

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    parent: "game-container",
    width: "100%",
    height: "100%"
  },

  input: {
    activePointers: 8
  },

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },

  scene: [GameScene]
};

new Phaser.Game(config);