// 游戏常量和等级定义
const LEVELS = [
    { id: 1, name: "宇宙尘埃", color: "#CCCCCC", radius: 2, mass: 1, gravityRadius: 10, speed: 5 },
    { id: 2, name: "灰尘", color: "#AAAAAA", radius: 4, mass: 5, gravityRadius: 15, speed: 4.8 },
    { id: 3, name: "沙粒", color: "#999999", radius: 6, mass: 25, gravityRadius: 20, speed: 4.6 },
    { id: 4, name: "砂砾", color: "#888888", radius: 8, mass: 125, gravityRadius: 25, speed: 4.4 },
    { id: 5, name: "小石子", color: "#777777", radius: 10, mass: 625, gravityRadius: 30, speed: 4.2 },
    { id: 6, name: "中石子", color: "#666666", radius: 12, mass: 3125, gravityRadius: 35, speed: 4.0 },
    { id: 7, name: "大石子", color: "#555555", radius: 14, mass: 15625, gravityRadius: 40, speed: 3.8 },
    { id: 8, name: "小石头", color: "#444444", radius: 16, mass: 78125, gravityRadius: 45, speed: 3.6 },
    { id: 9, name: "中石头", color: "#333333", radius: 18, mass: 390625, gravityRadius: 50, speed: 3.4 },
    { id: 10, name: "大石头", color: "#222222", radius: 20, mass: 1953125, gravityRadius: 60, speed: 3.2 },
    { id: 11, name: "岩石", color: "#111111", radius: 25, mass: 9765625, gravityRadius: 70, speed: 3.0 },
    { id: 12, name: "小行星碎片", color: "#005588", radius: 30, mass: 48828125, gravityRadius: 80, speed: 2.8 },
    { id: 13, name: "小行星", color: "#006699", radius: 40, mass: 244140625, gravityRadius: 100, speed: 2.6 },
    { id: 14, name: "大一点的小行星", color: "#0077AA", radius: 50, mass: 1220703125, gravityRadius: 120, speed: 2.4 },
    { id: 15, name: "矮行星", color: "#0088BB", radius: 60, mass: 6103515625, gravityRadius: 140, speed: 2.2 },
    { id: 16, name: "较小的卫星", color: "#0099CC", radius: 70, mass: 30517578125, gravityRadius: 160, speed: 2.0 },
    { id: 17, name: "较小的固态行星", color: "#00AADD", radius: 80, mass: 152587890625, gravityRadius: 180, speed: 1.8 },
    { id: 18, name: "较大的卫星", color: "#00BBEE", radius: 90, mass: 762939453125, gravityRadius: 200, speed: 1.6 },
    { id: 19, name: "较大的固态行星", color: "#00CCFF", radius: 100, mass: 3814697265625, gravityRadius: 220, speed: 1.4 },
    { id: 20, name: "气态行星", color: "#00DDFF", radius: 120, mass: 19073486328125, gravityRadius: 250, speed: 1.2 },
    { id: 21, name: "气态巨行星", color: "#00EEFF", radius: 140, mass: 95367431640625, gravityRadius: 280, speed: 1.0 },
    { id: 22, name: "褐矮星", color: "#996633", radius: 160, mass: 476837158203125, gravityRadius: 320, speed: 0.9 },
    { id: 23, name: "红矮星", color: "#FF3300", radius: 180, mass: 2384185791015625, gravityRadius: 360, speed: 0.8 },
    { id: 24, name: "黄矮星", color: "#FFFF00", radius: 200, mass: 11920928955078125, gravityRadius: 400, speed: 0.7 },
    { id: 25, name: "红巨星", color: "#FF6600", radius: 250, mass: 59604644775390625, gravityRadius: 500, speed: 0.6 },
    { id: 26, name: "蓝巨星", color: "#0066FF", radius: 220, mass: 298023223876953125, gravityRadius: 450, speed: 0.5 },
    { id: 27, name: "红超巨星", color: "#FF3300", radius: 300, mass: 1490116119384765625, gravityRadius: 600, speed: 0.4 },
    { id: 28, name: "蓝超巨星", color: "#0099FF", radius: 280, mass: 7450580596923828125, gravityRadius: 560, speed: 0.35 },
    { id: 29, name: "红特超巨星", color: "#FF0000", radius: 350, mass: 37252902984619140625, gravityRadius: 700, speed: 0.3 },
    { id: 30, name: "蓝特超巨星", color: "#33CCFF", radius: 320, mass: 186264514923095703125, gravityRadius: 640, speed: 0.25 },
    { id: 31, name: "黑矮星", color: "#000000", radius: 100, mass: 931322574615478515625, gravityRadius: 800, speed: 0.2 },
    { id: 32, name: "白矮星", color: "#FFFFFF", radius: 80, mass: 4656612873077392578125, gravityRadius: 700, speed: 0.15 },
    { id: 33, name: "大白矮星", color: "#EEEEEE", radius: 90, mass: 23283064365386962890625, gravityRadius: 750, speed: 0.1 },
    { id: 34, name: "中子星", color: "#FFCC00", radius: 30, mass: 116415321826934814453125, gravityRadius: 1000, speed: 0.08 },
    { id: 35, name: "脉冲星", color: "#FF9900", radius: 25, mass: 582076609134674072265625, gravityRadius: 1200, speed: 0.06 },
    { id: 36, name: "超大质量天体", color: "#FF0066", radius: 200, mass: 2910383045673370361328125, gravityRadius: 1500, speed: 0.04 },
    { id: 37, name: "小型黑洞", color: "#330033", radius: 50, mass: 14551915228366851806640625, gravityRadius: 2000, speed: 0.03 },
    { id: 38, name: "中型黑洞", color: "#220022", radius: 80, mass: 72759576141834259033203125, gravityRadius: 2500, speed: 0.02 },
    { id: 39, name: "大型黑洞", color: "#110011", radius: 120, mass: 363797880709171295166015625, gravityRadius: 3000, speed: 0.015 },
    { id: 40, name: "超大型黑洞", color: "#000000", radius: 180, mass: 1818989403545856475830078125, gravityRadius: 4000, speed: 0.01 },
    { id: 41, name: "星系级黑洞", color: "#000000", radius: 250, mass: 9094947017729282379150390625, gravityRadius: 5000, speed: 0.008 },
    { id: 42, name: "超星系级黑洞", color: "#000000", radius: 350, mass: 45474735088646411895751953125, gravityRadius: 7000, speed: 0.005 },
    { id: 43, name: "本星系群黑洞", color: "#000000", radius: 500, mass: 227373675443232059478759765625, gravityRadius: 10000, speed: 0.003 },
    { id: 44, name: "本超星系团黑洞", color: "#000000", radius: 700, mass: 1136868377216160297393798828125, gravityRadius: 15000, speed: 0.002 },
    { id: 45, name: "宇宙网节点黑洞", color: "#000000", radius: 1000, mass: 5684341886080801486968994140625, gravityRadius: 20000, speed: 0.001 },
    { id: 46, name: "多元宇宙通道", color: "#FF00FF", radius: 800, mass: 28421709430404007434844970703125, gravityRadius: 30000, speed: 0.0008 },
    { id: 47, name: "多元宇宙核心", color: "#FF33FF", radius: 1200, mass: 142108547152020037174224853515625, gravityRadius: 40000, speed: 0.0005 },
    { id: 48, name: "无限奇点", color: "#FFFFFF", radius: 1500, mass: 710542735760100185871124267578125, gravityRadius: 50000, speed: 0.0002 },
    { id: 49, name: "终极存在", color: "#FFFF00", radius: 2000, mass: 3552713678800500929355621337890625, gravityRadius: 70000, speed: 0.0001 },
    { id: 50, name: "宇宙创造者", color: "#FFFFFF", radius: 3000, mass: 17763568394002504646778106689453125, gravityRadius: 100000, speed: 0.00005 }
];

// 游戏常量
const GAME_CONSTANTS = {
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 700,
    MAX_CELESTIAL_BODIES: 80,
    SPAWN_RATE: 0.05,
    GRAVITY_CONSTANT: 0.1,
    FRICTION: 0.98,
    BOOST_MULTIPLIER: 2,
    COLLISION_DISTANCE_FACTOR: 0.8,
    EXPERIENCE_BASE: 0.01,
    MIN_SPAWN_DISTANCE: 300,
    TIDAL_FORCE_FACTOR: 0.005,
    FRAGMENT_COUNT: 15,
    CAMERA_SMOOTHING: 0.05
};

// 天体类
class CelestialBody {
    constructor(x, y, level, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.isPlayer = isPlayer;
        this.levelData = LEVELS[level - 1];
        this.radius = this.levelData.radius;
        this.mass = this.levelData.mass;
        this.color = this.levelData.color;
        this.gravityRadius = this.levelData.gravityRadius;
        this.speed = this.levelData.speed;
        
        // 运动属性
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        
        // 如果是玩家，添加额外属性
        if (isPlayer) {
            this.experience = 0;
            this.boost = false;
            this.fragments = [];
            this.trail = [];
            this.trailLength = 20;
        }
        
        // 视觉效果
        this.glow = 0;
        this.glowDirection = 1;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.05;
    }
    
    update() {
        // 更新位置
        this.vx += this.ax;
        this.vy += this.ay;
        
        // 应用摩擦
        this.vx *= GAME_CONSTANTS.FRICTION;
        this.vy *= GAME_CONSTANTS.FRICTION;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // 更新脉动效果
        this.pulse += this.pulseSpeed;
        if (this.pulse > Math.PI * 2) this.pulse -= Math.PI * 2;
        
        // 更新发光效果
        this.glow += 0.05 * this.glowDirection;
        if (this.glow > 1) {
            this.glow = 1;
            this.glowDirection = -1;
        } else if (this.glow < 0) {
            this.glow = 0;
            this.glowDirection = 1;
        }
        
        // 更新轨迹（仅玩家）
        if (this.isPlayer) {
            this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
            
            // 更新轨迹透明度
            for (let i = 0; i < this.trail.length; i++) {
                this.trail[i].alpha = i / this.trail.length;
            }
        }
    }
    
    applyGravity(otherBodies) {
        if (this.isPlayer) return; // 玩家不受引力影响（除了屏幕边缘）
        
        let totalFx = 0;
        let totalFy = 0;
        
        for (const body of otherBodies) {
            if (body === this) continue;
            
            const dx = body.x - this.x;
            const dy = body.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果距离太近，跳过避免无限引力
            if (distance < 5) continue;
            
            // 计算引力
            const force = GAME_CONSTANTS.GRAVITY_CONSTANT * (body.mass * this.mass) / (distance * distance);
            const angle = Math.atan2(dy, dx);
            
            totalFx += Math.cos(angle) * force;
            totalFy += Math.sin(angle) * force;
        }
        
        // 应用引力加速度
        this.ax = totalFx / this.mass;
        this.ay = totalFy / this.mass;
    }
    
    // 检查与另一个天体的碰撞
    checkCollision(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.radius + other.radius) * GAME_CONSTANTS.COLLISION_DISTANCE_FACTOR;
        
        return distance < minDistance;
    }
    
    // 计算潮汐效应
    calculateTidalForce(other) {
        if (this.level <= 10) return { tx: 0, ty: 0 }; // 小物体没有明显的潮汐效应
        
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius * 5) {
            const force = GAME_CONSTANTS.TIDAL_FORCE_FACTOR * (this.mass - other.mass) / (distance * distance);
            const angle = Math.atan2(dy, dx);
            
            return {
                tx: Math.cos(angle) * force,
                ty: Math.sin(angle) * force
            };
        }
        
        return { tx: 0, ty: 0 };
    }
    
    // 绘制天体
    draw(ctx, cameraX, cameraY) {
        // 计算屏幕位置
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        // 绘制轨迹（仅玩家）
        if (this.isPlayer && this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x - cameraX, this.trail[0].y - cameraY);
            
            for (let i = 1; i < this.trail.length; i++) {
                const point = this.trail[i];
                ctx.lineTo(point.x - cameraX, point.y - cameraY);
            }
            
            ctx.strokeStyle = `rgba(76, 201, 240, ${0.3 * this.trail[this.trail.length - 1].alpha})`;
            ctx.lineWidth = this.radius * 0.5;
            ctx.stroke();
        }
        
        // 绘制引力范围（仅当足够大时）
        if (this.level >= 5) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.gravityRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.hexToRgb(this.color).r}, ${this.hexToRgb(this.color).g}, ${this.hexToRgb(this.color).b}, 0.05)`;
            ctx.fill();
        }
        
        // 绘制发光效果
        const pulseFactor = 0.8 + 0.2 * Math.sin(this.pulse);
        const glowRadius = this.radius * (1 + this.glow * 0.2);
        
        // 外发光
        const gradient = ctx.createRadialGradient(
            screenX, screenY, this.radius,
            screenX, screenY, glowRadius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, `rgba(${this.hexToRgb(this.color).r}, ${this.hexToRgb(this.color).g}, ${this.hexToRgb(this.color).b}, 0)`);
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 主体
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * pulseFactor, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 高光
        ctx.beginPath();
        ctx.arc(
            screenX - this.radius * 0.3 * pulseFactor, 
            screenY - this.radius * 0.3 * pulseFactor, 
            this.radius * 0.4 * pulseFactor, 
            0, Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.2 * Math.sin(this.pulse)})`;
        ctx.fill();
        
        // 如果是玩家，绘制名称
        if (this.isPlayer) {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(this.levelData.name, screenX, screenY + this.radius + 20);
        }
    }
    
    // 工具方法：将十六进制颜色转换为RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
}

// 碎片类
class Fragment {
    constructor(x, y, level, vx, vy) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.levelData = LEVELS[level - 1];
        this.radius = this.levelData.radius * 0.5;
        this.mass = this.levelData.mass * 0.1;
        this.color = this.levelData.color;
        
        this.vx = vx;
        this.vy = vy;
        
        this.life = 1.0;
        this.decayRate = 0.02 + Math.random() * 0.03;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.life -= this.decayRate;
        this.rotation += this.rotationSpeed;
        
        return this.life > 0;
    }
    
    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.hexToRgb(this.color).r}, ${this.hexToRgb(this.color).g}, ${this.hexToRgb(this.color).b}, ${this.life})`;
        ctx.fill();
        
        ctx.restore();
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
}

// 游戏类
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
        this.height = canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;
        
        // 游戏状态
        this.player = null;
        this.celestialBodies = [];
        this.fragments = [];
        this.cameraX = 0;
        this.cameraY = 0;
        this.targetCameraX = 0;
        this.targetCameraY = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.controlMode = 'keyboard'; // 'keyboard' 或 'touch'
        
        // 控制状态
        this.keys = {};
        this.touchJoystick = { active: false, x: 0, y: 0, dx: 0, dy: 0 };
        this.boostActive = false;
        
        // 初始化
        this.init();
    }
    
    init() {
        // 创建玩家
        this.player = new CelestialBody(
            this.width / 2, 
            this.height / 2, 
            1, // 从宇宙尘埃开始
            true
        );
        
        // 生成初始天体
        this.generateInitialBodies();
        
        // 设置相机
        this.cameraX = this.player.x - this.width / 2;
        this.cameraY = this.player.y - this.height / 2;
        this.targetCameraX = this.cameraX;
        this.targetCameraY = this.cameraY;
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    generateInitialBodies() {
        this.celestialBodies = [];
        
        // 生成一些初始天体
        for (let i = 0; i < 20; i++) {
            this.spawnCelestialBody();
        }
    }
    
    spawnCelestialBody() {
        // 确保不超过最大数量
        if (this.celestialBodies.length >= GAME_CONSTANTS.MAX_CELESTIAL_BODIES) return;
        
        // 在玩家周围生成，但不要太近
        let x, y;
        let attempts = 0;
        const maxAttempts = 20;
        
        do {
            const angle = Math.random() * Math.PI * 2;
            const distance = GAME_CONSTANTS.MIN_SPAWN_DISTANCE + Math.random() * 500;
            
            x = this.player.x + Math.cos(angle) * distance;
            y = this.player.y + Math.sin(angle) * distance;
            attempts++;
        } while (this.isTooCloseToPlayer(x, y) && attempts < maxAttempts);
        
        // 确定生成的天体级别（不超过玩家级别+3）
        const maxLevel = Math.min(this.player.level + 3, LEVELS.length);
        const minLevel = 1;
        const level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
        
        const body = new CelestialBody(x, y, level);
        
        // 给新生成的天体一个随机的初始速度
        const speed = 0.5 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        body.vx = Math.cos(angle) * speed;
        body.vy = Math.sin(angle) * speed;
        
        this.celestialBodies.push(body);
    }
    
    isTooCloseToPlayer(x, y) {
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < GAME_CONSTANTS.MIN_SPAWN_DISTANCE;
    }
    
    setupEventListeners() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // 空格键加速
            if (e.key === ' ' && this.controlMode === 'keyboard') {
                this.boostActive = true;
                this.player.boost = true;
            }
            
            // R键重新开始
            if (e.key === 'r' || e.key === 'R') {
                this.restartGame();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            if (e.key === ' ' && this.controlMode === 'keyboard') {
                this.boostActive = false;
                this.player.boost = false;
            }
        });
        
        // 触控摇杆事件
        const joystickBase = document.getElementById('joystick-base');
        const joystickThumb = document.getElementById('joystick-thumb');
        
        if (joystickBase && joystickThumb) {
            let joystickRect = joystickBase.getBoundingClientRect();
            const joystickCenterX = joystickRect.left + joystickRect.width / 2;
            const joystickCenterY = joystickRect.top + joystickRect.height / 2;
            const maxDistance = joystickRect.width / 2 - joystickThumb.offsetWidth / 2;
            
            const updateJoystickPosition = (clientX, clientY) => {
                if (!this.touchJoystick.active) return;
                
                const dx = clientX - joystickCenterX;
                const dy = clientY - joystickCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                let constrainedDistance = Math.min(distance, maxDistance);
                const angle = Math.atan2(dy, dx);
                
                const thumbX = Math.cos(angle) * constrainedDistance;
                const thumbY = Math.sin(angle) * constrainedDistance;
                
                joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
                
                // 更新控制值
                this.touchJoystick.dx = dx / maxDistance;
                this.touchJoystick.dy = dy / maxDistance;
            };
            
            // 触控开始
            joystickBase.addEventListener('touchstart', (e) => {
                if (this.controlMode !== 'touch') return;
                e.preventDefault();
                this.touchJoystick.active = true;
                updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
            });
            
            joystickBase.addEventListener('mousedown', (e) => {
                if (this.controlMode !== 'touch') return;
                e.preventDefault();
                this.touchJoystick.active = true;
                updateJoystickPosition(e.clientX, e.clientY);
            });
            
            // 触控移动
            document.addEventListener('touchmove', (e) => {
                if (!this.touchJoystick.active || this.controlMode !== 'touch') return;
                e.preventDefault();
                updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!this.touchJoystick.active || this.controlMode !== 'touch') return;
                e.preventDefault();
                updateJoystickPosition(e.clientX, e.clientY);
            });
            
            // 触控结束
            document.addEventListener('touchend', (e) => {
                if (this.controlMode !== 'touch') return;
                this.touchJoystick.active = false;
                this.touchJoystick.dx = 0;
                this.touchJoystick.dy = 0;
                joystickThumb.style.transform = 'translate(0, 0)';
            });
            
            document.addEventListener('mouseup', (e) => {
                if (this.controlMode !== 'touch') return;
                this.touchJoystick.active = false;
                this.touchJoystick.dx = 0;
                this.touchJoystick.dy = 0;
                joystickThumb.style.transform = 'translate(0, 0)';
            });
        }
        
        // 加速按钮事件
        const boostBtn = document.getElementById('boost-btn');
        if (boostBtn) {
            boostBtn.addEventListener('touchstart', (e) => {
                if (this.controlMode !== 'touch') return;
                e.preventDefault();
                this.boostActive = true;
                this.player.boost = true;
            });
            
            boostBtn.addEventListener('mousedown', (e) => {
                if (this.controlMode !== 'touch') return;
                e.preventDefault();
                this.boostActive = true;
                this.player.boost = true;
            });
            
            boostBtn.addEventListener('touchend', (e) => {
                if (this.controlMode !== 'touch') return;
                e.preventDefault();
                this.boostActive = false;
                this.player.boost = false;
            });
            
            boostBtn.addEventListener('mouseup', (e) => {
                if (this.controlMode !== 'touch') return;
                e.preventDefault();
                this.boostActive = false;
                this.player.boost = false;
            });
        }
        
        // 控制模式切换
        const keyboardControlBtn = document.getElementById('keyboard-control');
        const touchControlBtn = document.getElementById('touch-control');
        
        if (keyboardControlBtn && touchControlBtn) {
            keyboardControlBtn.addEventListener('click', () => {
                this.setControlMode('keyboard');
            });
            
            touchControlBtn.addEventListener('click', () => {
                this.setControlMode('touch');
            });
        }
        
        // 开始/继续游戏按钮
        const startBtn = document.getElementById('start-btn');
        const continueBtn = document.getElementById('continue-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.continueGame();
            });
        }
    }
    
    setControlMode(mode) {
        this.controlMode = mode;
        
        // 更新UI
        const keyboardControlBtn = document.getElementById('keyboard-control');
        const touchControlBtn = document.getElementById('touch-control');
        const keyboardInstructions = document.getElementById('keyboard-instructions');
        const touchInstructions = document.getElementById('touch-instructions');
        const touchControls = document.getElementById('touch-controls');
        
        if (mode === 'keyboard') {
            keyboardControlBtn.classList.add('active');
            touchControlBtn.classList.remove('active');
            keyboardInstructions.style.display = 'block';
            touchInstructions.style.display = 'none';
            touchControls.style.display = 'none';
        } else {
            keyboardControlBtn.classList.remove('active');
            touchControlBtn.classList.add('active');
            keyboardInstructions.style.display = 'none';
            touchInstructions.style.display = 'block';
            touchControls.style.display = 'flex';
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        document.getElementById('game-overlay').style.display = 'none';
    }
    
    continueGame() {
        this.gameRunning = true;
        document.getElementById('game-overlay').style.display = 'none';
    }
    
    restartGame() {
        this.player = new CelestialBody(
            this.width / 2, 
            this.height / 2, 
            1, // 从宇宙尘埃开始
            true
        );
        
        this.celestialBodies = [];
        this.fragments = [];
        this.score = 0;
        this.gameOver = false;
        
        this.generateInitialBodies();
        this.updateUI();
    }
    
    updatePlayerControls() {
        // 重置加速度
        this.player.ax = 0;
        this.player.ay = 0;
        
        let moveX = 0;
        let moveY = 0;
        
        if (this.controlMode === 'keyboard') {
            // 键盘控制
            if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
            if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
            if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
            if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
        } else {
            // 触控控制
            moveX = this.touchJoystick.dx;
            moveY = this.touchJoystick.dy;
        }
        
        // 归一化移动向量
        const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
        if (magnitude > 0) {
            moveX /= magnitude;
            moveY /= magnitude;
        }
        
        // 应用移动
        const speed = this.player.speed * (this.boostActive ? GAME_CONSTANTS.BOOST_MULTIPLIER : 1);
        this.player.vx = moveX * speed;
        this.player.vy = moveY * speed;
    }
    
    updateCamera() {
        // 平滑跟随玩家
        this.targetCameraX = this.player.x - this.width / 2;
        this.targetCameraY = this.player.y - this.height / 2;
        
        this.cameraX += (this.targetCameraX - this.cameraX) * GAME_CONSTANTS.CAMERA_SMOOTHING;
        this.cameraY += (this.targetCameraY - this.cameraY) * GAME_CONSTANTS.CAMERA_SMOOTHING;
    }
    
    handleCollisions() {
        // 玩家与其他天体的碰撞
        for (let i = this.celestialBodies.length - 1; i >= 0; i--) {
            const body = this.celestialBodies[i];
            
            if (this.player.checkCollision(body)) {
                const levelDiff = Math.abs(this.player.level - body.level);
                
                // 检查是否可以吞噬
                if (this.player.level > body.level + 2 || this.player.level <= 3) {
                    // 吞噬较小的天体
                    this.absorbBody(body, i);
                } else if (levelDiff <= 3) {
                    // 碰撞碎裂
                    this.handleCollisionShatter(this.player, body);
                    this.celestialBodies.splice(i, 1);
                    
                    // 如果玩家等级>=5，可以附身到碎片上
                    if (this.player.level >= 5 && !this.gameOver) {
                        this.gameOver = true;
                        this.showGameOver("你被撞碎了！可以附身到碎片上继续游戏");
                    } else if (this.player.level < 5) {
                        this.gameOver = true;
                        this.showGameOver("游戏结束！你被撞碎了");
                    }
                }
            }
        }
        
        // 天体之间的碰撞
        for (let i = 0; i < this.celestialBodies.length; i++) {
            for (let j = i + 1; j < this.celestialBodies.length; j++) {
                const body1 = this.celestialBodies[i];
                const body2 = this.celestialBodies[j];
                
                if (body1.checkCollision(body2)) {
                    const levelDiff = Math.abs(body1.level - body2.level);
                    
                    if (levelDiff <= 3) {
                        // 碰撞碎裂
                        this.handleCollisionShatter(body1, body2);
                        this.celestialBodies.splice(j, 1);
                        this.celestialBodies.splice(i, 1);
                        i--; // 调整索引
                        break;
                    }
                }
            }
        }
    }
    
    absorbBody(body, index) {
        // 计算经验值
        const levelDiff = this.player.level - body.level;
        let experienceGained = 0;
        
        if (levelDiff === 4) {
            experienceGained = GAME_CONSTANTS.EXPERIENCE_BASE; // 0.01%
        } else if (levelDiff > 4) {
            experienceGained = GAME_CONSTANTS.EXPERIENCE_BASE / Math.pow(100, levelDiff - 4);
        } else {
            experienceGained = 0.1; // 对于级别差小于4的情况，给予更多经验
        }
        
        // 添加经验
        this.player.experience += experienceGained;
        
        // 检查升级
        if (this.player.experience >= 1) {
            this.player.level++;
            this.player.experience = 0;
            
            // 更新玩家属性
            this.player.levelData = LEVELS[this.player.level - 1];
            this.player.radius = this.player.levelData.radius;
            this.player.mass = this.player.levelData.mass;
            this.player.color = this.player.levelData.color;
            this.player.gravityRadius = this.player.levelData.gravityRadius;
            this.player.speed = this.player.levelData.speed;
            
            // 显示升级效果
            this.showUpgradeEffect();
        }
        
        // 移除被吞噬的天体
        this.celestialBodies.splice(index, 1);
        
        // 增加分数
        this.score += body.level;
        
        // 更新UI
        this.updateUI();
    }
    
    handleCollisionShatter(body1, body2) {
        // 确定哪个天体更小
        const smallerBody = body1.level < body2.level ? body1 : body2;
        const largerBody = body1.level < body2.level ? body2 : body1;
        
        // 创建碎片
        const fragmentCount = GAME_CONSTANTS.FRAGMENT_COUNT;
        const minFragmentLevel = Math.max(1, smallerBody.level - 5);
        
        for (let i = 0; i < fragmentCount; i++) {
            // 随机碎片级别
            const fragmentLevel = Math.floor(Math.random() * (smallerBody.level - minFragmentLevel + 1)) + minFragmentLevel;
            
            // 随机速度方向
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            
            const fragment = new Fragment(
                smallerBody.x,
                smallerBody.y,
                fragmentLevel,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            
            this.fragments.push(fragment);
        }
        
        // 如果两个天体级别相同，也创建大天体的碎片
        if (body1.level === body2.level) {
            for (let i = 0; i < fragmentCount; i++) {
                const fragmentLevel = Math.floor(Math.random() * (largerBody.level - minFragmentLevel + 1)) + minFragmentLevel;
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;
                
                const fragment = new Fragment(
                    largerBody.x,
                    largerBody.y,
                    fragmentLevel,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
                
                this.fragments.push(fragment);
            }
        }
    }
    
    showUpgradeEffect() {
        // 在实际游戏中，这里可以添加视觉效果
        console.log(`升级到 ${this.player.levelData.name}!`);
    }
    
    showGameOver(message) {
        this.gameRunning = false;
        
        const overlay = document.getElementById('game-overlay');
        const overlayTitle = document.getElementById('overlay-title');
        const overlayText = document.getElementById('overlay-text');
        const startBtn = document.getElementById('start-btn');
        const continueBtn = document.getElementById('continue-btn');
        
        overlayTitle.textContent = "游戏结束";
        overlayText.textContent = message;
        startBtn.style.display = 'none';
        continueBtn.style.display = 'block';
        continueBtn.textContent = "重新开始";
        
        overlay.style.display = 'flex';
    }
    
    updateUI() {
        // 更新等级名称
        document.getElementById('level-name').textContent = this.player.levelData.name;
        
        // 更新经验条
        const progressPercent = this.player.experience * 100;
        document.getElementById('progress-bar').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').textContent = `${progressPercent.toFixed(2)}%`;
        
        // 更新属性
        document.getElementById('mass-value').textContent = this.formatNumber(this.player.mass);
        document.getElementById('gravity-radius').textContent = this.player.gravityRadius;
        document.getElementById('speed-value').textContent = this.player.speed.toFixed(2);
        
        // 更新下一等级显示
        const nextLevelsContainer = document.getElementById('next-levels');
        nextLevelsContainer.innerHTML = '';
        
        for (let i = this.player.level; i < Math.min(this.player.level + 3, LEVELS.length); i++) {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'next-level';
            levelDiv.textContent = `${LEVELS[i].name} (${i + 1}级)`;
            nextLevelsContainer.appendChild(levelDiv);
        }
        
        // 更新进化路线
        const evolutionStages = document.querySelectorAll('.evolution-stage');
        evolutionStages.forEach((stage, index) => {
            if (index + 1 === this.player.level) {
                stage.classList.add('current');
                stage.textContent = `${index + 1}. ${LEVELS[index].name}`;
            } else {
                stage.classList.remove('current');
                if (index < LEVELS.length) {
                    stage.textContent = `${index + 1}. ${LEVELS[index].name}`;
                }
            }
        });
    }
    
    formatNumber(num) {
        if (num >= 1e24) return (num / 1e24).toFixed(1) + "Y";
        if (num >= 1e21) return (num / 1e21).toFixed(1) + "Z";
        if (num >= 1e18) return (num / 1e18).toFixed(1) + "E";
        if (num >= 1e15) return (num / 1e15).toFixed(1) + "P";
        if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
        if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
        if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
        return num.toFixed(0);
    }
    
    update() {
        if (!this.gameRunning || this.gameOver) return;
        
        // 更新玩家控制
        this.updatePlayerControls();
        
        // 更新玩家
        this.player.update();
        
        // 更新相机
        this.updateCamera();
        
        // 更新其他天体
        for (const body of this.celestialBodies) {
            body.applyGravity([...this.celestialBodies, this.player]);
            body.update();
        }
        
        // 更新碎片
        this.fragments = this.fragments.filter(fragment => fragment.update());
        
        // 处理碰撞
        this.handleCollisions();
        
        // 随机生成新天体
        if (Math.random() < GAME_CONSTANTS.SPAWN_RATE) {
            this.spawnCelestialBody();
        }
        
        // 玩家吞噬碎片
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            const dx = fragment.x - this.player.x;
            const dy = fragment.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.radius * 2) {
                // 计算经验值（碎片经验较少）
                const levelDiff = this.player.level - fragment.level;
                let experienceGained = 0;
                
                if (levelDiff >= 4) {
                    experienceGained = GAME_CONSTANTS.EXPERIENCE_BASE / Math.pow(100, levelDiff - 3) / 10;
                } else {
                    experienceGained = 0.001; // 小量经验
                }
                
                this.player.experience += experienceGained;
                this.fragments.splice(i, 1);
                
                // 检查升级
                if (this.player.experience >= 1) {
                    this.player.level++;
                    this.player.experience = 0;
                    
                    // 更新玩家属性
                    this.player.levelData = LEVELS[this.player.level - 1];
                    this.player.radius = this.player.levelData.radius;
                    this.player.mass = this.player.levelData.mass;
                    this.player.color = this.player.levelData.color;
                    this.player.gravityRadius = this.player.levelData.gravityRadius;
                    this.player.speed = this.player.levelData.speed;
                    
                    // 显示升级效果
                    this.showUpgradeEffect();
                }
                
                // 更新UI
                this.updateUI();
            }
        }
    }
    
    draw() {
        // 清除画布
        this.ctx.fillStyle = '#0a0c23';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制星空背景
        this.drawStars();
        
        // 绘制所有天体
        for (const body of this.celestialBodies) {
            body.draw(this.ctx, this.cameraX, this.cameraY);
        }
        
        // 绘制碎片
        for (const fragment of this.fragments) {
            fragment.draw(this.ctx, this.cameraX, this.cameraY);
        }
        
        // 绘制玩家
        this.player.draw(this.ctx, this.cameraX, this.cameraY);
        
        // 绘制分数
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`分数: ${this.score}`, 20, 40);
        
        // 绘制引力提示
        if (this.player.level >= 10) {
            this.ctx.fillStyle = 'rgba(76, 201, 240, 0.7)';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('你的引力现在可以影响其他天体了！', this.width / 2, 70);
            this.ctx.fillText('尝试吸引小天体到大天体附近，让它们相撞', this.width / 2, 95);
        }
    }
    
    drawStars() {
        // 简单的星空背景
        const starCount = 200;
        
        for (let i = 0; i < starCount; i++) {
            // 使用缓存或固定位置的星星，相对于相机移动
            const starX = (i * 137) % this.width;
            const starY = (i * 237) % this.height;
            
            // 计算星星的视差效果（更远的星星移动较慢）
            const parallaxFactor = 0.5 + (i % 10) / 20;
            const screenX = (starX - this.cameraX * parallaxFactor) % this.width;
            const screenY = (starY - this.cameraY * parallaxFactor) % this.height;
            
            // 确保星星在屏幕内
            const adjustedX = screenX < 0 ? screenX + this.width : screenX;
            const adjustedY = screenY < 0 ? screenY + this.height : screenY;
            
            const brightness = 100 + (i % 5) * 30;
            const radius = 0.5 + (i % 3) * 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(adjustedX, adjustedY, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            this.ctx.fill();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}