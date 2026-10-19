// 游戏主对象
const Game = {
    canvas: null,
    ctx: null,
    player: null,
    asteroids: [],
    lasers: [],
    enemies: [],
    particles: [],
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: false,
    gamePaused: false,
    keys: {},
    
    // 初始化游戏
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 创建玩家飞船
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 40,
            height: 60,
            speed: 7,
            color: '#4a9eff'
        };
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 初始绘制
        this.draw();
        
        // 更新UI
        this.updateUI();
    },
    
    // 设置事件监听
    setupEventListeners() {
        // 键盘控制
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // 空格键发射激光
            if (e.key === ' ' && this.gameRunning && !this.gamePaused) {
                this.shootLaser();
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // 按钮控制
        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    },
    
    // 开始游戏
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.asteroids = [];
        this.lasers = [];
        this.enemies = [];
        this.particles = [];
        
        // 初始创建一些陨石
        for (let i = 0; i < 5 + this.level; i++) {
            this.createAsteroid();
        }
        
        this.updateUI();
        this.gameLoop();
        
        document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> 游戏中...';
    },
    
    // 切换暂停状态
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseBtn').innerHTML = this.gamePaused ? 
            '<i class="fas fa-play"></i> 继续' : 
            '<i class="fas fa-pause"></i> 暂停';
    },
    
    // 重置游戏
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.asteroids = [];
        this.lasers = [];
        this.enemies = [];
        this.particles = [];
        
        // 重置玩家位置
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        
        this.updateUI();
        this.draw();
        
        document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> 开始游戏';
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> 暂停';
    },
    
    // 游戏主循环
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // 清空画布
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制星空背景
        this.drawStars();
        
        // 处理玩家移动
        this.handlePlayerMovement();
        
        // 更新和绘制所有游戏对象
        this.updateAndDrawAsteroids();
        this.updateAndDrawLasers();
        this.updateAndDrawParticles();
        
        // 绘制玩家飞船
        this.drawPlayer();
        
        // 检查碰撞
        this.checkCollisions();
        
        // 随机生成新陨石
        if (Math.random() < 0.02 + this.level * 0.005) {
            this.createAsteroid();
        }
        
        // 更新UI
        this.updateUI();
        
        // 检查游戏结束
        if (this.lives <= 0) {
            this.gameOver();
            return;
        }
        
        // 等级提升
        if (this.score >= this.level * 100) {
            this.level++;
            this.createLevelUpEffect();
        }
        
        // 继续循环
        requestAnimationFrame(() => this.gameLoop());
    },
    
    // 绘制星空背景
    drawStars() {
        // 创建静态星空（只需绘制一次）
        if (!this.stars) {
            this.stars = [];
            for (let i = 0; i < 100; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: Math.random() * 2,
                    brightness: Math.random() * 0.5 + 0.5
                });
            }
        }
        
        // 绘制星星
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    },
    
    // 处理玩家移动
    handlePlayerMovement() {
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.x = Math.max(this.player.width/2, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.x = Math.min(this.canvas.width - this.player.width/2, this.player.x + this.player.speed);
        }
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.player.y = Math.max(this.player.height/2, this.player.y - this.player.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.player.y = Math.min(this.canvas.height - this.player.height/2, this.player.y + this.player.speed);
        }
    },
    
    // 绘制玩家飞船
    drawPlayer() {
        const { x, y, width, height, color } = this.player;
        
        // 绘制飞船主体
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - height/2);
        this.ctx.lineTo(x + width/2, y + height/2);
        this.ctx.lineTo(x - width/2, y + height/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 绘制飞船细节
        this.ctx.fillStyle = '#a3d5ff';
        this.ctx.fillRect(x - 5, y + height/2 - 10, 10, 15);
        
        // 绘制引擎火焰
        const flameHeight = 15 + Math.sin(Date.now() * 0.01) * 5;
        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 8, y + height/2);
        this.ctx.lineTo(x, y + height/2 + flameHeight);
        this.ctx.lineTo(x + 8, y + height/2);
        this.ctx.closePath();
        this.ctx.fill();
    },
    
    // 发射激光
    shootLaser() {
        this.lasers.push({
            x: this.player.x,
            y: this.player.y - this.player.height/2,
            width: 4,
            height: 20,
            speed: 12,
            color: '#00ffff'
        });
        
        // 创建发射粒子效果
        this.createParticles(this.player.x, this.player.y + this.player.height/2, 5, '#00ffff');
    },
    
    // 创建陨石
    createAsteroid() {
        const size = 20 + Math.random() * 30;
        this.asteroids.push({
            x: Math.random() * this.canvas.width,
            y: -size,
            size: size,
            speed: 1 + Math.random() * 2 + this.level * 0.5,
            color: `hsl(${Math.random() * 30 + 20}, 70%, 50%)`,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05
        });
    },
    
    // 更新和绘制陨石
    updateAndDrawAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            // 更新位置
            asteroid.y += asteroid.speed;
            asteroid.rotation += asteroid.rotationSpeed;
            
            // 绘制陨石
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            this.ctx.fillStyle = asteroid.color;
            this.ctx.beginPath();
            for (let j = 0; j < 8; j++) {
                const angle = (j / 8) * Math.PI * 2;
                const radius = asteroid.size * (0.7 + Math.sin(angle * 3) * 0.3);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (j === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
            
            // 移除超出画布的陨石
            if (asteroid.y > this.canvas.height + asteroid.size) {
                this.asteroids.splice(i, 1);
            }
        }
    },
    
    // 更新和绘制激光
    updateAndDrawLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            // 更新位置
            laser.y -= laser.speed;
            
            // 绘制激光
            this.ctx.fillStyle = laser.color;
            this.ctx.fillRect(laser.x - laser.width/2, laser.y, laser.width, laser.height);
            
            // 激光尾迹效果
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            this.ctx.fillRect(laser.x - laser.width/2, laser.y + laser.height, laser.width, 10);
            
            // 移除超出画布的激光
            if (laser.y < -laser.height) {
                this.lasers.splice(i, 1);
            }
        }
    },
    
    // 创建粒子效果
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 4 + 1,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: color,
                life: 30 + Math.random() * 30
            });
        }
    },
    
    // 更新和绘制粒子
    updateAndDrawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置和生命值
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.life--;
            
            // 绘制粒子
            this.ctx.globalAlpha = particle.life / 60;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            this.ctx.globalAlpha = 1;
            
            // 移除生命结束的粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },
    
    // 检查碰撞
    checkCollisions() {
        // 检查激光与陨石的碰撞
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                
                const dx = laser.x - asteroid.x;
                const dy = laser.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < asteroid.size) {
                    // 碰撞发生
                    this.score += Math.floor(asteroid.size);
                    this.lasers.splice(i, 1);
                    this.asteroids.splice(j, 1);
                    
                    // 创建爆炸效果
                    this.createParticles(asteroid.x, asteroid.y, 15, '#ff6600');
                    break;
                }
            }
        }
        
        // 检查玩家与陨石的碰撞
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            const dx = this.player.x - asteroid.x;
            const dy = this.player.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.size + this.player.width/2) {
                // 碰撞发生
                this.lives--;
                this.asteroids.splice(i, 1);
                
                // 创建碰撞效果
                this.createParticles(asteroid.x, asteroid.y, 20, '#ff0000');
                
                // 玩家闪烁效果
                this.playerHitEffect();
                
                if (this.lives <= 0) {
                    return;
                }
            }
        }
    },
    
    // 玩家被击中效果
    playerHitEffect() {
        const originalColor = this.player.color;
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            this.player.color = blinkCount % 2 === 0 ? '#ff0000' : originalColor;
            blinkCount++;
            
            if (blinkCount > 6) {
                clearInterval(blinkInterval);
                this.player.color = originalColor;
            }
        }, 200);
    },
    
    // 创建升级效果
    createLevelUpEffect() {
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                size: Math.random() * 5 + 2,
                speedX: Math.cos(angle) * 5,
                speedY: Math.sin(angle) * 5,
                color: `hsl(${Math.random() * 60 + 200}, 100%, 60%)`,
                life: 60 + Math.random() * 60
            });
        }
    },
    
    // 游戏结束
    gameOver() {
        this.gameRunning = false;
        
        // 绘制游戏结束文字
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText(`最终分数: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 20);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('点击"重置"按钮重新开始', this.canvas.width/2, this.canvas.height/2 + 70);
        
        document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> 开始游戏';
    },
    
    // 更新UI显示
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    },
    
    // 初始绘制
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawStars();
        this.drawPlayer();
        
        // 绘制游戏标题
        this.ctx.fillStyle = '#4a9eff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VScode太空射击游戏', this.canvas.width/2, this.canvas.height/2 - 30);
        
        this.ctx.fillStyle = '#a3d5ff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('点击"开始游戏"按钮开始', this.canvas.width/2, this.canvas.height/2 + 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('使用方向键移动，空格键射击', this.canvas.width/2, this.canvas.height/2 + 60);
    }
};

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    Game.init();
});
