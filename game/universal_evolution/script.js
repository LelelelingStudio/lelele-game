// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 获取canvas元素
    const canvas = document.getElementById('game-canvas');
    
    // 创建游戏实例
    const game = new Game(canvas);
    
    // 显示开始界面
    const overlay = document.getElementById('game-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayText = document.getElementById('overlay-text');
    
    overlayTitle.textContent = "宇宙吞噬进化游戏";
    overlayText.innerHTML = `
        控制你的宇宙尘埃在太空中游荡，吞噬其他天体来成长进化。<br><br>
        从微小的宇宙尘埃开始，逐步进化到恒星、黑洞，最终成为宇宙的创造者！<br><br>
        使用键盘或触控来控制你的天体，小心别被更大的天体撞碎！
    `;
    
    overlay.style.display = 'flex';
    
    // 设置默认控制模式为键盘
    game.setControlMode('keyboard');
    
    // 添加重新开始按钮事件
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            game.restartGame();
        });
    }
    
    // 添加键盘快捷键说明
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && game.gameRunning) {
            game.gameRunning = false;
            
            const overlay = document.getElementById('game-overlay');
            const overlayTitle = document.getElementById('overlay-title');
            const overlayText = document.getElementById('overlay-text');
            const startBtn = document.getElementById('start-btn');
            const continueBtn = document.getElementById('continue-btn');
            
            overlayTitle.textContent = "游戏已暂停";
            overlayText.textContent = "点击继续按钮回到游戏";
            startBtn.style.display = 'none';
            continueBtn.style.display = 'block';
            continueBtn.textContent = "继续游戏";
            
            overlay.style.display = 'flex';
        }
    });
    
    // 添加窗口调整大小事件
    window.addEventListener('resize', () => {
        // 可以在这里添加响应式调整代码
        console.log('窗口大小已改变，游戏可能需要重新调整');
    });
    
    // 输出游戏说明到控制台
    console.log(`
    ============================================
    宇宙吞噬进化游戏
    ============================================
    游戏控制:
    - W/A/S/D 或方向键: 移动
    - 空格键: 加速
    - R: 重新开始游戏
    - ESC: 暂停游戏
    
    游戏规则:
    1. 吞噬比你小3级以上的天体来获得经验
    2. 利用引力吸引天体相撞，然后吞噬碎片
    3. 小心别被同级或更大的天体撞碎
    4. 等级≥5时，被撞碎后可以附身到碎片上
    
    进化路线:
    从宇宙尘埃开始，最终进化到宇宙创造者(50级)
    ============================================
    `);
});