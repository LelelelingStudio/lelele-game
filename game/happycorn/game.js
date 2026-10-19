// ==================== 游戏状态 ====================
const gameState = {
    gold: 300,
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    day: 1,
    ownedPlots: 6,
    totalPlots: 30,
    selectedCrop: null,
    inventory: {},
    storageCapacity: 50,
    storageUsed: 0,
    plots: [],
    season: "春季",
    weather: "晴朗",
    nextWeather: "晴朗",
    activeEffects: {
        goldenWateringCan: false,
        scarecrow: false,
        greenhouse: false,
        irrigationSystem: false,
        blessingOfHarvest: false,
        seedMultiplier: 1,
        factoryBoost: false
    },
    mallItems: {},
    processingItems: [],
    completedItems: [],
    nextDayCooldown: 0,
    eventFrequency: 2.0,
    merchant: { present: false, nextVisit: 7, daysRemaining: 0, priceMultiplier: 2.0 },
    auctionListings: [], // 交易行上架物品
    marketPrices: {},
    unlockedCornVarieties: 1,
    unlockedOtherCrops: false,
    unlockedSkins: ['default', 'spring'],
    currentSkin: 'default',
    theftProbability: 0.15,
    lastTheftDay: 0
};

// 季节与天气（补全）
const seasons = ["春季", "夏季", "秋季", "冬季"];
const weatherTypes = ["晴朗", "多云", "小雨", "大雨", "暴风雨"];

// ==================== 作物数据 ====================
// 20种玉米品种
const cornVarieties = [
    { id: 1, name: "成单716", icon: "🌽", growthTime: 5, price: 40, sellPrice: 90, description: "高产稳产型玉米", category: "corn", size: 1 },
    { id: 2, name: "川单99", icon: "🌽", growthTime: 6, price: 45, sellPrice: 100, description: "抗病优质玉米", category: "corn", size: 1 },
    { id: 3, name: "先玉1171", icon: "🌽", growthTime: 6, price: 50, sellPrice: 110, description: "早熟高产", category: "corn", size: 1 },
    { id: 4, name: "辽禾308", icon: "🌽", growthTime: 7, price: 55, sellPrice: 120, description: "耐密植品种", category: "corn", size: 1 },
    { id: 5, name: "华试919", icon: "🌽", growthTime: 5, price: 48, sellPrice: 105, description: "适应性广", category: "corn", size: 1 },
    { id: 6, name: "渝甜糯990", icon: "🌽🍬", growthTime: 6, price: 60, sellPrice: 130, description: "甜糯双味", category: "corn", size: 1 },
    { id: 7, name: "东甜糯209", icon: "🌽🍬", growthTime: 6, price: 62, sellPrice: 135, description: "甜糯型", category: "corn", size: 1 },
    { id: 8, name: "FNL80", icon: "🌽", growthTime: 5, price: 52, sellPrice: 115, description: "南方鲜食糯玉米", category: "corn", size: 1 },
    { id: 9, name: "东甜糯206", icon: "🌽🍬", growthTime: 6, price: 65, sellPrice: 140, description: "甜糯玉米", category: "corn", size: 1 },
    { id: 10, name: "美甜糯5号", icon: "🌽🍬", growthTime: 6, price: 68, sellPrice: 145, description: "美国甜糯品种", category: "corn", size: 1 },
    { id: 11, name: "京科糯2000", icon: "🌽🍚", growthTime: 7, price: 70, sellPrice: 150, description: "糯质型玉米", category: "corn", size: 1 },
    { id: 12, name: "华珍", icon: "🌽🍬", growthTime: 6, price: 72, sellPrice: 155, description: "甜质型玉米", category: "corn", size: 1 },
    { id: 13, name: "金爆1号", icon: "🌽💥", growthTime: 7, price: 75, sellPrice: 160, description: "爆裂型玉米", category: "corn", size: 1 },
    { id: 14, name: "中单9409", icon: "🌽💪", growthTime: 8, price: 80, sellPrice: 170, description: "高赖氨酸玉米", category: "corn", size: 1 },
    { id: 15, name: "渝青386", icon: "🌽🌿", growthTime: 9, price: 85, sellPrice: 180, description: "青贮玉米", category: "corn", size: 1 },
    { id: 16, name: "高油115", icon: "🌽🛢️", growthTime: 8, price: 90, sellPrice: 190, description: "高油玉米", category: "corn", size: 1 },
    { id: 17, name: "郑单958", icon: "🌽🏭", growthTime: 7, price: 95, sellPrice: 200, description: "高淀粉玉米", category: "corn", size: 1 },
    { id: 18, name: "白马牙", icon: "🌽⚪", growthTime: 6, price: 88, sellPrice: 185, description: "粉质型玉米", category: "corn", size: 1 },
    { id: 19, name: "小金黄", icon: "🌽🟡", growthTime: 6, price: 92, sellPrice: 195, description: "硬粒型玉米", category: "corn", size: 1 },
    { id: 20, name: "有稃型玉米", icon: "🌽🌾", growthTime: 10, price: 100, sellPrice: 220, description: "原始种质", category: "corn", size: 1 }
];

// 20种其他作物
const otherCrops = [
    { id: 21, name: "萝卜", icon: "🥕", growthTime: 3, price: 15, sellPrice: 30, description: "快速生长", category: "other", size: 1 },
    { id: 22, name: "生菜", icon: "🥬", growthTime: 3, price: 20, sellPrice: 40, description: "绿叶蔬菜", category: "other", size: 1 },
    { id: 23, name: "菠菜", icon: "🌿", growthTime: 4, price: 25, sellPrice: 55, description: "营养丰富", category: "other", size: 1 },
    { id: 24, name: "小麦", icon: "🌾", growthTime: 4, price: 25, sellPrice: 55, description: "基础谷物", category: "other", size: 1 },
    { id: 25, name: "水稻", icon: "🌾", growthTime: 5, price: 30, sellPrice: 70, description: "主食作物", category: "other", size: 1 },
    { id: 26, name: "番茄", icon: "🍅", growthTime: 6, price: 60, sellPrice: 140, description: "多汁果实", category: "other", size: 1 },
    { id: 27, name: "土豆", icon: "🥔", growthTime: 5, price: 30, sellPrice: 65, description: "地下块茎", category: "other", size: 1 },
    { id: 28, name: "草莓", icon: "🍓", growthTime: 5, price: 80, sellPrice: 200, description: "甜美浆果", category: "other", size: 1 },
    { id: 29, name: "西瓜", icon: "🍉", growthTime: 8, price: 120, sellPrice: 300, description: "消暑佳品", category: "other", size: 2 },
    { id: 30, name: "葡萄", icon: "🍇", growthTime: 7, price: 150, sellPrice: 350, description: "可酿酒", category: "other", size: 1 },
    { id: 31, name: "苹果", icon: "🍎", growthTime: 10, price: 200, sellPrice: 500, description: "经典水果", category: "other", size: 2 },
    { id: 32, name: "南瓜", icon: "🎃", growthTime: 7, price: 100, sellPrice: 250, description: "秋季作物", category: "other", size: 2 },
    { id: 33, name: "黄金葡萄", icon: "🍇✨", growthTime: 12, price: 500, sellPrice: 1500, description: "稀有品种", category: "other", size: 2 },
    { id: 34, name: "人参", icon: "🌿💊", growthTime: 12, price: 300, sellPrice: 800, description: "药用植物", category: "other", size: 2 },
    { id: 35, name: "灵芝", icon: "🍄✨", growthTime: 15, price: 500, sellPrice: 1200, description: "仙草", category: "other", size: 2 },
    { id: 36, name: "棉花", icon: "☁️", growthTime: 6, price: 40, sellPrice: 80, description: "纺织原料", category: "other", size: 1 },
    { id: 37, name: "甜菜", icon: "🍠", growthTime: 5, price: 35, sellPrice: 70, description: "制糖原料", category: "other", size: 1 },
    { id: 38, name: "甘蔗", icon: "🎋", growthTime: 4, price: 30, sellPrice: 60, description: "高糖作物", category: "other", size: 1 },
    { id: 39, name: "芝麻", icon: "⚫", growthTime: 5, price: 45, sellPrice: 90, description: "榨油原料", category: "other", size: 1 },
    { id: 40, name: "薄荷", icon: "🌿❄️", growthTime: 4, price: 40, sellPrice: 85, description: "清凉植物", category: "other", size: 1 }
];

const allCrops = [...cornVarieties, ...otherCrops];

// ==================== 加工产品 ====================
const factoryProducts = [
    { id: 1, name: "玉米片", icon: "🌽🥨", description: "香脆玉米片", level: 1, requirements: [{ cropId: 1, amount: 4 }], processingTime: 2, processingCost: 30, sellPrice: 350 },
    { id: 2, name: "草莓果酱", icon: "🍓🍯", description: "甜美果酱", level: 1, requirements: [{ cropId: 28, amount: 3 }], processingTime: 2, processingCost: 30, sellPrice: 450 },
    { id: 3, name: "小麦面包", icon: "🍞", description: "松软面包", level: 1, requirements: [{ cropId: 24, amount: 3 }], processingTime: 2, processingCost: 20, sellPrice: 300 },
    { id: 4, name: "番茄酱", icon: "🍅🥫", description: "经典酱料", level: 1, requirements: [{ cropId: 26, amount: 5 }], processingTime: 2, processingCost: 25, sellPrice: 400 },
    { id: 5, name: "苹果汁", icon: "🧃", description: "新鲜果汁", level: 1, requirements: [{ cropId: 31, amount: 2 }], processingTime: 3, processingCost: 40, sellPrice: 700 },
    { id: 6, name: "棉布", icon: "👕", description: "柔软布料", level: 1, requirements: [{ cropId: 36, amount: 5 }], processingTime: 3, processingCost: 50, sellPrice: 500 },
    { id: 7, name: "白糖", icon: "🍬", description: "精制白糖", level: 1, requirements: [{ cropId: 37, amount: 4 }], processingTime: 2, processingCost: 40, sellPrice: 400 },
    { id: 8, name: "芝麻油", icon: "🫒", description: "香浓芝麻油", level: 1, requirements: [{ cropId: 39, amount: 5 }], processingTime: 3, processingCost: 60, sellPrice: 600 },
    { id: 9, name: "人参茶", icon: "🍵🌿", description: "滋补茶饮", level: 5, requirements: [{ cropId: 34, amount: 2 }], processingTime: 4, processingCost: 100, sellPrice: 1200 },
    { id: 10, name: "薄荷糖", icon: "🍬🌿", description: "清凉糖", level: 5, requirements: [{ cropId: 40, amount: 3 }, { productId: 7, amount: 1 }], processingTime: 3, processingCost: 80, sellPrice: 800 },
    { id: 11, name: "果酱面包", icon: "🍞🍓", description: "夹心面包", level: 10, requirements: [{ productId: 2, amount: 1 }, { productId: 3, amount: 1 }], processingTime: 3, processingCost: 50, sellPrice: 1000 },
    { id: 12, name: "超级玉米片", icon: "🌽✨", description: "顶级玉米片", level: 10, requirements: [{ productId: 1, amount: 2 }, { cropId: 26, amount: 2 }], processingTime: 4, processingCost: 70, sellPrice: 1500 },
    { id: 13, name: "水果拼盘", icon: "🍎🍓🍇", description: "豪华拼盘", level: 10, requirements: [{ cropId: 28, amount: 2 }, { cropId: 30, amount: 2 }, { cropId: 31, amount: 1 }], processingTime: 4, processingCost: 80, sellPrice: 1800 },
    { id: 14, name: "灵芝精华", icon: "💊✨", description: "浓缩精华", level: 15, requirements: [{ cropId: 35, amount: 3 }, { productId: 9, amount: 1 }], processingTime: 6, processingCost: 200, sellPrice: 3000 },
    { id: 15, name: "豪华果酱面包", icon: "🍞✨", description: "奢华面包", level: 20, requirements: [{ productId: 11, amount: 1 }, { cropId: 33, amount: 1 }], processingTime: 5, processingCost: 200, sellPrice: 3000 },
    { id: 16, name: "黄金人参茶", icon: "🍵✨", description: "顶级茶饮", level: 20, requirements: [{ productId: 9, amount: 2 }, { cropId: 33, amount: 1 }], processingTime: 6, processingCost: 300, sellPrice: 4000 },
    { id: 17, name: "皇家衣物套装", icon: "👑👕", description: "奢华衣物", level: 25, requirements: [{ productId: 6, amount: 3 }, { productId: 8, amount: 2 }, { cropId: 33, amount: 1 }], processingTime: 8, processingCost: 400, sellPrice: 6000 },
    { id: 18, name: "仙丹妙药", icon: "💊🌟", description: "传说仙丹", level: 30, requirements: [{ productId: 14, amount: 1 }, { productId: 9, amount: 2 }, { cropId: 33, amount: 2 }], processingTime: 10, processingCost: 800, sellPrice: 10000 },
    { id: 19, name: "超级能量棒", icon: "🍫⚡", description: "能量食品", level: 20, requirements: [{ productId: 13, amount: 1 }, { productId: 12, amount: 2 }, { cropId: 33, amount: 1 }], processingTime: 7, processingCost: 350, sellPrice: 5000 },
    { id: 20, name: "至尊玉米宴", icon: "🌽🍽️", description: "玉米全席", level: 30, requirements: [{ cropId: 20, amount: 5 }, { productId: 12, amount: 2 }, { productId: 15, amount: 1 }], processingTime: 12, processingCost: 1000, sellPrice: 15000 }
];

// ==================== 商城道具 ====================
const mallItems = [
    { id: 1, name: "黄金水壶", price: 1000, icon: "🚿", description: "浇水效果翻倍", effect: "goldenWateringCan", permanent: true, storageSize: 1 },
    { id: 2, name: "稻草人", price: 800, icon: "🛡️", description: "防止小偷", effect: "scarecrow", duration: 30, storageSize: 2 },
    { id: 3, name: "温室大棚", price: 2500, icon: "🏠", description: "抵御恶劣天气", effect: "greenhouse", duration: 50, storageSize: 3 },
    { id: 4, name: "灌溉系统", price: 1500, icon: "💧", description: "自动浇水", effect: "irrigationSystem", duration: 40, storageSize: 2 },
    { id: 5, name: "丰收祝福", price: 3000, icon: "✨", description: "产量翻倍", effect: "blessingOfHarvest", duration: 20, storageSize: 1 },
    { id: 6, name: "超级肥料", price: 500, icon: "🧪", description: "立即成熟", effect: "instantGrow", consumable: true, storageSize: 1 },
    { id: 7, name: "种子复制器", price: 2000, icon: "📋", description: "购买种子双倍", effect: "seedMultiplier", permanent: true, multiplier: 2, storageSize: 1 },
    { id: 8, name: "加工加速器", price: 1200, icon: "⚡", description: "加工时间减半", effect: "factoryBoost", duration: 30, storageSize: 1 }
];

// ==================== 皮肤数据 ====================
const gameSkins = [
    { id: 'default', name: '绿色农场', levelRequired: 1, background: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)', plotColor: '#c5e1a5', borderColor: '#81c784' },
    { id: 'spring', name: '樱花农场', levelRequired: 5, background: 'linear-gradient(135deg, #ffb7c5 0%, #ffccd5 100%)', plotColor: '#ffccbc', borderColor: '#ffab91' },
    { id: 'summer', name: '海洋农场', levelRequired: 10, background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', plotColor: '#bbdefb', borderColor: '#90caf9' },
    { id: 'autumn', name: '金色麦浪', levelRequired: 15, background: 'linear-gradient(135deg, #ffd54f 0%, #ffb74d 100%)', plotColor: '#ffecb3', borderColor: '#ffcc80' },
    { id: 'winter', name: '冰雪王国', levelRequired: 20, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', plotColor: '#e8f5e9', borderColor: '#b3e5fc' }
];

// ==================== 辅助函数 ====================
function initGame() {
    initPlots();
    initInventory();
    initMarketPrices();
    initMallItems();
    initMerchant();
    initTimer();
    initNotification();
    updateWeather();
    applySkin('default');
    renderGame();
    setupEventListeners();
    addLog("🌽 欢迎来到玉米工厂大亨·品种纪元！种植不同玉米品种，解锁新作物！", "success");
}

function initPlots() {
    for (let i = 0; i < gameState.totalPlots; i++) {
        gameState.plots.push({
            id: i, owned: i < gameState.ownedPlots, planted: false,
            crop: null, growthStage: 0, growthProgress: 0,
            watered: false, sick: false, coveredByRocks: false
        });
    }
}

function initInventory() {
    allCrops.forEach(crop => {
        gameState.inventory[crop.name] = { count: 0, selected: false };
    });
    factoryProducts.forEach(p => { gameState.inventory[p.name] = { count: 0, selected: false }; });
    gameState.inventory["成单716"] = { count: 10, selected: false };
    gameState.storageUsed += 10;
}

function initMarketPrices() {
    allCrops.forEach(crop => {
        gameState.marketPrices[crop.name] = Math.floor(crop.sellPrice * (0.8 + Math.random() * 0.4));
    });
}

function initMallItems() {
    mallItems.forEach(item => {
        gameState.mallItems[item.id] = { purchased: false, daysLeft: 0 };
    });
}

function initMerchant() {
    gameState.merchant.nextVisit = Math.floor(Math.random() * 9) + 7;
    gameState.merchant.priceMultiplier = 1.8 + Math.random() * 0.7;
}

function initTimer() {
    setInterval(() => {
        if (gameState.nextDayCooldown > 0) {
            gameState.nextDayCooldown--;
            updateTimerDisplay();
        }
    }, 1000);
}

function initNotification() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;max-width:300px;';
    document.body.appendChild(container);
}

function showNotification(msg, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const colors = { info: '#2196f3', success: '#4caf50', warning: '#ff9800', danger: '#f44336', event: '#9c27b0' };
    const div = document.createElement('div');
    div.style.cssText = `background:${colors[type]};color:white;padding:12px;border-radius:12px;animation:slideIn 0.3s;display:flex;justify-content:space-between;align-items:center;gap:10px;`;
    div.innerHTML = `<span>${msg}</span><button style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">&times;</button>`;
    div.querySelector('button').onclick = () => div.remove();
    container.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

function addLog(msg, type = 'info') {
    const logDiv = document.getElementById('log');
    if (!logDiv) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `第${gameState.day}天: ${msg}`;
    logDiv.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (logDiv.children.length > 50) logDiv.removeChild(logDiv.firstChild);
}

function updateTimerDisplay() {
    const progress = document.getElementById('timer-progress');
    const text = document.getElementById('timer-text');
    const btn = document.getElementById('next-day-btn');
    if (gameState.nextDayCooldown > 0) {
        progress.style.width = `${(60 - gameState.nextDayCooldown) / 60 * 100}%`;
        text.textContent = `${gameState.nextDayCooldown}秒`;
        btn.disabled = true;
    } else {
        progress.style.width = '100%';
        text.textContent = '准备就绪';
        btn.disabled = false;
    }
}

function updateWeather() {
    if (gameState.day % 10 === 0 && gameState.day > 0) {
        const idx = seasons.indexOf(gameState.season);
        gameState.season = seasons[(idx + 1) % seasons.length];
        addLog(`季节更替，现在是${gameState.season}。`, 'event');
    }
    const r = Math.random();
    if (r < 0.5) gameState.nextWeather = "晴朗";
    else if (r < 0.75) gameState.nextWeather = "多云";
    else if (r < 0.9) gameState.nextWeather = "小雨";
    else if (r < 0.98) gameState.nextWeather = "大雨";
    else gameState.nextWeather = "暴风雨";
    gameState.weather = gameState.nextWeather;
}

function renderGame() {
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('exp').textContent = `${gameState.exp}/${gameState.expToNextLevel}`;
    document.getElementById('day').textContent = gameState.day;
    document.getElementById('owned-plots').textContent = gameState.ownedPlots;
    document.getElementById('total-plots').textContent = gameState.totalPlots;
    document.getElementById('storage-capacity').textContent = gameState.storageCapacity;
    document.getElementById('storage-used').textContent = gameState.storageUsed;
    document.getElementById('storage-stat').textContent = `${gameState.storageUsed}/${gameState.storageCapacity}`;
    document.getElementById('season').textContent = gameState.season;
    document.getElementById('weather').textContent = gameState.weather;
    const storagePercent = (gameState.storageUsed / gameState.storageCapacity) * 100;
    document.getElementById('storage-progress').style.width = `${storagePercent}%`;
    document.getElementById('event-rate').textContent = `${gameState.eventFrequency.toFixed(1)}x`;
    document.getElementById('current-level').textContent = gameState.level;
    const tip = document.getElementById('next-day-tip');
    if (gameState.nextWeather === "晴朗") tip.textContent = "提示: 明天天气晴朗，适合种植";
    else if (gameState.nextWeather === "小雨") tip.textContent = "提示: 明天有小雨，作物生长加快20%";
    else if (gameState.nextWeather === "大雨") tip.textContent = "提示: 明天有大雨，作物生长加快40%";
    else if (gameState.nextWeather === "暴风雨") tip.textContent = "警告: 明天有暴风雨，作物可能受损！";
    else tip.textContent = "提示: 明天天气多云，正常生长";
    document.getElementById('merchant-countdown').textContent = gameState.merchant.present ? "今天" : gameState.merchant.nextVisit;
    renderFarmland();
    renderCropsShop();
    renderInventory();
    renderMarket();
    renderMerchantPanel();
    renderAuction();
    updateButtons();
}

function renderFarmland() {
    const farmland = document.getElementById('farmland');
    farmland.innerHTML = '';
    gameState.plots.forEach((plot, idx) => {
        const div = document.createElement('div');
        div.className = 'plot';
        if (plot.coveredByRocks) {
            div.classList.add('locked');
            div.innerHTML = `<div class="plot-icon"><i class="fas fa-mountain"></i></div><div class="plot-info">被石子掩埋</div>`;
            div.onclick = () => tryClearRocks(plot.id);
        } else if (!plot.owned) {
            div.classList.add('empty');
            div.innerHTML = `<div class="plot-icon"><i class="fas fa-lock"></i></div><div class="plot-info">未开垦</div>`;
            div.onclick = () => tryBuyLand();
        } else if (plot.sick) {
            div.classList.add('sick');
            const crop = allCrops.find(c => c.id === plot.crop);
            const stageIdx = Math.min(Math.floor(plot.growthStage / (crop.growthTime / 3)), 2);
            const icon = crop.stages ? crop.stages[stageIdx] : crop.icon;
            div.innerHTML = `<div class="plot-icon">${icon}</div><div class="plot-info">${crop.name}<br>生病了！</div><div class="crop-stage">${plot.growthStage}/${crop.growthTime}</div><div class="sick-indicator"><i class="fas fa-biohazard"></i></div>${plot.watered ? '<div class="water-indicator"><i class="fas fa-tint"></i></div>' : ''}`;
            div.onclick = () => tryCurePlant(plot.id);
        } else if (plot.planted) {
            div.classList.add('planted');
            const crop = allCrops.find(c => c.id === plot.crop);
            const stageIdx = Math.min(Math.floor(plot.growthStage / (crop.growthTime / 3)), 2);
            const icon = crop.stages ? crop.stages[stageIdx] : crop.icon;
            div.innerHTML = `<div class="plot-icon">${icon}</div><div class="plot-info">${crop.name}</div><div class="crop-stage">${plot.growthStage}/${crop.growthTime}</div>${plot.watered ? '<div class="water-indicator"><i class="fas fa-tint"></i></div>' : ''}`;
            div.onclick = () => tryHarvest(plot.id);
        } else {
            div.classList.add('owned');
            div.innerHTML = `<div class="plot-icon"><i class="fas fa-seedling"></i></div><div class="plot-info">空地<br>点击种植</div>`;
            div.onclick = () => openPlantingMenu(plot.id);
        }
        farmland.appendChild(div);
    });
}

function renderCropsShop() {
    const list = document.getElementById('crops-list');
    list.innerHTML = '';
    const filter = document.querySelector('.filter-btn.active').dataset.filter;
    let cropsToShow = [];
    if (filter === 'corn') {
        cropsToShow = cornVarieties.slice(0, gameState.unlockedCornVarieties);
    } else if (filter === 'other') {
        cropsToShow = gameState.unlockedOtherCrops ? otherCrops : [];
    } else {
        cropsToShow = [...cornVarieties.slice(0, gameState.unlockedCornVarieties)];
        if (gameState.unlockedOtherCrops) cropsToShow.push(...otherCrops);
    }
    cropsToShow.forEach(crop => {
        const actualPrice = Math.floor(crop.price / gameState.activeEffects.seedMultiplier);
        const div = document.createElement('div');
        div.className = 'crop-item';
        div.innerHTML = `
            <div><div class="crop-name">${crop.icon} ${crop.name}</div><div class="crop-growth">${crop.description}</div><div class="crop-growth">生长: ${crop.growthTime}天</div></div>
            <div style="text-align:right;"><div class="crop-price">${actualPrice}金币</div><div class="crop-growth">售出: ${crop.sellPrice}金币</div></div>
        `;
        div.onclick = () => selectCrop(crop.id);
        if (gameState.selectedCrop === crop.id) div.style.backgroundColor = '#e8f5e9';
        list.appendChild(div);
    });
}

function renderInventory() {
    const container = document.getElementById('inventory');
    container.innerHTML = '';
    let totalValue = 0;
    for (let [name, item] of Object.entries(gameState.inventory)) {
        if (item.count > 0) {
            const crop = allCrops.find(c => c.name === name);
            const product = factoryProducts.find(p => p.name === name);
            const value = crop ? crop.sellPrice : (product ? product.sellPrice : 0);
            totalValue += value * item.count;
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <div><div class="inventory-name">${crop ? crop.icon : (product ? product.icon : '📦')} ${name}</div><div class="inventory-value">单价: ${value}金币</div></div>
                <div style="text-align:right;"><div class="inventory-amount">${item.count}个</div><div>价值: ${value * item.count}金币</div></div>
            `;
            container.appendChild(div);
        }
    }
    if (container.children.length === 0) container.innerHTML = '<div style="text-align:center;color:#888;">仓库空空</div>';
    document.getElementById('inventory-value').textContent = totalValue;
}

function renderMarket() {
    const container = document.getElementById('market-items');
    container.innerHTML = '';
    for (let [name, price] of Object.entries(gameState.marketPrices)) {
        const count = gameState.inventory[name]?.count || 0;
        if (count > 0) {
            const div = document.createElement('div');
            div.className = 'market-item';
            div.innerHTML = `<span>${name}</span><span>💰 ${price}金币/个</span><span>库存: ${count}</span><button class="btn-small" data-name="${name}">出售1个</button>`;
            div.querySelector('button').onclick = () => sellToMarket(name, 1);
            container.appendChild(div);
        }
    }
    if (container.children.length === 0) container.innerHTML = '<div style="text-align:center;color:#888;">没有可出售的物品</div>';
}

function renderMerchantPanel() {
    const container = document.getElementById('merchant-items');
    container.innerHTML = '';
    if (!gameState.merchant.present) {
        container.innerHTML = '<div style="text-align:center;color:#888;">商人不在，过几天再来吧</div>';
        return;
    }
    for (let [name, item] of Object.entries(gameState.inventory)) {
        if (item.count > 0) {
            const crop = allCrops.find(c => c.name === name);
            const product = factoryProducts.find(p => p.name === name);
            const basePrice = crop ? crop.sellPrice : (product ? product.sellPrice : 0);
            if (basePrice > 0) {
                const merchantPrice = Math.floor(basePrice * gameState.merchant.priceMultiplier);
                const div = document.createElement('div');
                div.className = 'merchant-item';
                div.innerHTML = `
                    <input type="checkbox" data-name="${name}" ${item.selected ? 'checked' : ''}>
                    <span>${name}</span>
                    <span>💰 ${merchantPrice}金币/个</span>
                    <span>库存: ${item.count}</span>
                `;
                const cb = div.querySelector('input');
                cb.onclick = (e) => { e.stopPropagation(); toggleItemSelection(name); };
                div.onclick = () => { cb.checked = !cb.checked; toggleItemSelection(name); };
                container.appendChild(div);
            }
        }
    }
    if (container.children.length === 0) container.innerHTML = '<div style="text-align:center;color:#888;">没有可出售的物品</div>';
}

function renderAuction() {
    const select = document.getElementById('auction-item-select');
    select.innerHTML = '<option value="">选择物品</option>';
    for (let [name, item] of Object.entries(gameState.inventory)) {
        if (item.count > 0) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = `${name} (库存: ${item.count})`;
            select.appendChild(option);
        }
    }
    const listedDiv = document.getElementById('listed-items');
    listedDiv.innerHTML = '';
    gameState.auctionListings.forEach((listing, idx) => {
        const div = document.createElement('div');
        div.className = 'listed-item';
        div.innerHTML = `
            <span>${listing.itemName}</span>
            <span>数量: ${listing.quantity}</span>
            <span class="price">${listing.pricePerUnit}金币/个</span>
            <span class="days-left">剩余${listing.daysLeft}天</span>
            <button class="btn-small" data-idx="${idx}">下架</button>
        `;
        div.querySelector('button').onclick = () => delistItem(idx);
        listedDiv.appendChild(div);
    });
    if (listedDiv.children.length === 0) listedDiv.innerHTML = '<div style="text-align:center;color:#888;">暂无上架商品</div>';
}

function toggleItemSelection(name) {
    if (gameState.inventory[name]) {
        gameState.inventory[name].selected = !gameState.inventory[name].selected;
        renderMerchantPanel();
    }
}

function sellToMarket(itemName, quantity) {
    if (!gameState.inventory[itemName] || gameState.inventory[itemName].count < quantity) {
        addLog(`库存不足，无法出售${itemName}`, 'warning');
        return;
    }
    const price = gameState.marketPrices[itemName];
    const total = price * quantity;
    gameState.gold += total;
    gameState.inventory[itemName].count -= quantity;
    if (gameState.inventory[itemName].count === 0) delete gameState.inventory[itemName];
    updateStorageUsage();
    addLog(`出售了${quantity}个${itemName}，获得${total}金币。`, 'success');
    renderGame();
}

function sellToMerchant() {
    if (!gameState.merchant.present) {
        addLog("商人不在，无法出售", 'warning');
        return;
    }
    let totalGold = 0;
    let soldCount = 0;
    for (let [name, item] of Object.entries(gameState.inventory)) {
        if (item.selected && item.count > 0) {
            const crop = allCrops.find(c => c.name === name);
            const product = factoryProducts.find(p => p.name === name);
            const basePrice = crop ? crop.sellPrice : (product ? product.sellPrice : 0);
            if (basePrice > 0) {
                const price = Math.floor(basePrice * gameState.merchant.priceMultiplier);
                totalGold += price * item.count;
                soldCount += item.count;
                delete gameState.inventory[name];
            }
        }
    }
    if (soldCount > 0) {
        gameState.gold += totalGold;
        updateStorageUsage();
        addLog(`向商人出售了${soldCount}件物品，获得${totalGold}金币！`, 'success');
    } else {
        addLog("没有选中任何物品", 'warning');
    }
    renderGame();
}

function listAuctionItem() {
    const select = document.getElementById('auction-item-select');
    const itemName = select.value;
    if (!itemName) { addLog("请选择物品", 'warning'); return; }
    const price = parseInt(document.getElementById('auction-price').value);
    const quantity = parseInt(document.getElementById('auction-quantity').value);
    if (isNaN(price) || price <= 0) { addLog("请输入有效价格", 'warning'); return; }
    if (isNaN(quantity) || quantity <= 0) { addLog("请输入有效数量", 'warning'); return; }
    if (!gameState.inventory[itemName] || gameState.inventory[itemName].count < quantity) {
        addLog("库存不足", 'warning');
        return;
    }
    const marketPrice = gameState.marketPrices[itemName];
    if (price < marketPrice) {
        addLog("交易行价格不能低于市场价", 'warning');
        return;
    }
    gameState.inventory[itemName].count -= quantity;
    if (gameState.inventory[itemName].count === 0) delete gameState.inventory[itemName];
    gameState.auctionListings.push({
        itemName, quantity, pricePerUnit: price,
        listedDay: gameState.day, daysLeft: 7
    });
    updateStorageUsage();
    addLog(`已将${quantity}个${itemName}上架交易行，单价${price}金币。`, 'success');
    renderGame();
}

function delistItem(idx) {
    const listing = gameState.auctionListings[idx];
    if (!listing) return;
    if (!gameState.inventory[listing.itemName]) gameState.inventory[listing.itemName] = { count: 0, selected: false };
    gameState.inventory[listing.itemName].count += listing.quantity;
    gameState.auctionListings.splice(idx, 1);
    updateStorageUsage();
    addLog(`已将${listing.itemName}从交易行下架，退回仓库。`, 'info');
    renderGame();
}

function updateAuction() {
    for (let i = gameState.auctionListings.length-1; i >= 0; i--) {
        const listing = gameState.auctionListings[i];
        listing.daysLeft--;
        if (listing.daysLeft <= 0) {
            if (!gameState.inventory[listing.itemName]) gameState.inventory[listing.itemName] = { count: 0, selected: false };
            gameState.inventory[listing.itemName].count += listing.quantity;
            gameState.auctionListings.splice(i,1);
            addLog(`${listing.itemName}上架7天未售出，已退回仓库。`, 'warning');
            continue;
        }
        const marketPrice = gameState.marketPrices[listing.itemName];
        let probability = 0.8 - (listing.pricePerUnit / marketPrice - 1) * 0.35;
        probability = Math.min(0.8, Math.max(0.1, probability));
        if (Math.random() < probability) {
            const total = listing.pricePerUnit * listing.quantity;
            gameState.gold += total;
            addLog(`恭喜！您的${listing.itemName}在交易行以单价${listing.pricePerUnit}金币售出，获得${total}金币。`, 'success');
            gameState.auctionListings.splice(i,1);
        }
    }
}

function tryClearRocks(plotId) {
    if (gameState.gold >= 50) {
        gameState.gold -= 50;
        gameState.plots[plotId].coveredByRocks = false;
        addLog("清理了石子，花费50金币。", 'success');
        renderGame();
    } else addLog("金币不足，无法清理石子！", 'warning');
}

function tryCurePlant(plotId) {
    if (gameState.gold >= 30) {
        gameState.gold -= 30;
        gameState.plots[plotId].sick = false;
        addLog("治疗了生病植物，花费30金币。", 'success');
        renderGame();
    } else addLog("金币不足，无法治疗！", 'warning');
}

function tryBuyLand() {
    if (gameState.gold >= 100 && gameState.ownedPlots < gameState.totalPlots) {
        gameState.gold -= 100;
        gameState.ownedPlots++;
        for (let p of gameState.plots) {
            if (!p.owned && !p.coveredByRocks) { p.owned = true; break; }
        }
        addLog(`开垦新地！花费100金币，现在拥有${gameState.ownedPlots}块地。`, 'success');
        renderGame();
    } else addLog("无法开垦新地！", 'warning');
}

function selectCrop(cropId) {
    gameState.selectedCrop = cropId;
    const crop = allCrops.find(c => c.id === cropId);
    addLog(`选择了${crop.name}种子。`, 'info');
    renderCropsShop();
}

function openPlantingMenu(plotId) {
    if (gameState.selectedCrop === null) {
        addLog("请先在种子商店选择作物！", 'warning');
        return;
    }
    const crop = allCrops.find(c => c.id === gameState.selectedCrop);
    if (!crop) return;
    const actualPrice = Math.floor(crop.price / gameState.activeEffects.seedMultiplier);
    if (gameState.gold < actualPrice) {
        addLog(`金币不足，需要${actualPrice}金币购买${crop.name}种子！`, 'warning');
        return;
    }
    gameState.gold -= actualPrice;
    const plot = gameState.plots[plotId];
    plot.planted = true;
    plot.crop = crop.id;
    plot.growthStage = 1;
    plot.growthProgress = 1;
    plot.watered = false;
    plot.sick = false;
    if (!crop.stages) crop.stages = [crop.icon, crop.icon, crop.icon];
    addLog(`在土地上种植了${crop.name}！花费${actualPrice}金币。`, 'success');
    renderGame();
}

function tryHarvest(plotId) {
    const plot = gameState.plots[plotId];
    const crop = allCrops.find(c => c.id === plot.crop);
    if (plot.growthStage >= crop.growthTime) {
        harvestCrop(plotId);
    } else {
        addLog(`${crop.name}还没成熟！还需要${crop.growthTime - plot.growthStage}天。`, 'warning');
    }
}

function harvestCrop(plotId) {
    const plot = gameState.plots[plotId];
    const crop = allCrops.find(c => c.id === plot.crop);
    let yieldMult = gameState.activeEffects.blessingOfHarvest ? 2 : 1;
    if (addToStorage(crop.name, yieldMult)) {
        const expGain = Math.floor(crop.sellPrice / 5) * yieldMult;
        gameState.exp += expGain;
        plot.planted = false;
        plot.crop = null;
        plot.growthStage = 0;
        plot.growthProgress = 0;
        plot.watered = false;
        plot.sick = false;
        addLog(`收获了${crop.name}！获得${expGain}经验。`, 'success');
        checkLevelUp();
        renderGame();
    } else {
        addLog(`仓库空间不足，无法收获${crop.name}！`, 'warning');
    }
}

function waterAllCrops() {
    if (gameState.gold < 20) { addLog("金币不足，无法浇水！", 'warning'); return; }
    let count = 0;
    gameState.plots.forEach(plot => {
        if (plot.planted && !plot.watered && !plot.sick) {
            plot.watered = true;
            let bonus = 0.5;
            if (gameState.activeEffects.goldenWateringCan) bonus = 1.0;
            plot.growthProgress += bonus;
            count++;
        }
    });
    if (count > 0) {
        gameState.gold -= 20;
        addLog(`一键浇水完成！浇灌了${count}块地，花费20金币。`, 'success');
        renderGame();
    } else addLog("没有需要浇水的作物。", 'warning');
}

function harvestAllCrops() {
    let count = 0;
    let totalExp = 0;
    gameState.plots.forEach((plot, idx) => {
        if (plot.planted && !plot.sick) {
            const crop = allCrops.find(c => c.id === plot.crop);
            if (plot.growthStage >= crop.growthTime) {
                let yieldMult = gameState.activeEffects.blessingOfHarvest ? 2 : 1;
                if (addToStorage(crop.name, yieldMult)) {
                    const expGain = Math.floor(crop.sellPrice / 5) * yieldMult;
                    gameState.exp += expGain;
                    totalExp += expGain;
                    plot.planted = false;
                    plot.crop = null;
                    plot.growthStage = 0;
                    plot.growthProgress = 0;
                    plot.watered = false;
                    count++;
                }
            }
        }
    });
    if (count > 0) {
        addLog(`一键收获了${count}块地，获得${totalExp}经验。`, 'success');
        checkLevelUp();
        renderGame();
    } else addLog("没有可收获的作物。", 'warning');
}

function upgradeStorage() {
    const cost = 200;
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.storageCapacity += 50;
        addLog(`升级仓库！容量+50，花费${cost}金币。`, 'success');
        renderGame();
    } else addLog("金币不足！", 'warning');
}

function addToStorage(itemName, amount) {
    if (!hasStorageSpace(itemName, amount)) {
        addLog(`仓库空间不足，无法存放${itemName}！`, 'warning');
        return false;
    }
    if (!gameState.inventory[itemName]) gameState.inventory[itemName] = { count: 0, selected: false };
    gameState.inventory[itemName].count += amount;
    updateStorageUsage();
    return true;
}

function hasStorageSpace(itemName, amount) {
    let size = 1;
    const crop = allCrops.find(c => c.name === itemName);
    if (crop && crop.size) size = crop.size;
    const required = size * amount;
    return (gameState.storageCapacity - gameState.storageUsed) >= required;
}

function updateStorageUsage() {
    let used = 0;
    for (let [name, item] of Object.entries(gameState.inventory)) {
        if (item.count > 0) {
            let size = 1;
            const crop = allCrops.find(c => c.name === name);
            if (crop && crop.size) size = crop.size;
            used += size * item.count;
        }
    }
    gameState.storageUsed = used;
    document.getElementById('storage-used').textContent = used;
    const percent = (used / gameState.storageCapacity) * 100;
    document.getElementById('storage-progress').style.width = `${percent}%`;
}

function checkLevelUp() {
    while (gameState.exp >= gameState.expToNextLevel) {
        gameState.exp -= gameState.expToNextLevel;
        gameState.level++;
        gameState.expToNextLevel = Math.floor(gameState.expToNextLevel * 1.5);
        const reward = gameState.level * 50;
        gameState.gold += reward;
        addLog(`恭喜升级到${gameState.level}级！获得${reward}金币奖励！`, 'success');
        if (gameState.level <= 20 && gameState.level > gameState.unlockedCornVarieties) {
            gameState.unlockedCornVarieties = gameState.level;
            addLog(`解锁了新玉米品种：${cornVarieties[gameState.level-1].name}！`, 'event');
        }
        if (gameState.level >= 20 && !gameState.unlockedOtherCrops) {
            gameState.unlockedOtherCrops = true;
            addLog(`🎉 达到20级！解锁了20种其他作物！快去种子商店看看吧！`, 'event');
        }
        gameSkins.forEach(skin => {
            if (gameState.level >= skin.levelRequired && !gameState.unlockedSkins.includes(skin.id)) {
                gameState.unlockedSkins.push(skin.id);
                addLog(`解锁新皮肤：${skin.name}！`, 'event');
            }
        });
        if (gameState.level % 5 === 0 && gameState.ownedPlots < gameState.totalPlots) {
            for (let p of gameState.plots) {
                if (!p.owned && !p.coveredByRocks) {
                    p.owned = true;
                    gameState.ownedPlots++;
                    addLog(`作为升级奖励，你获得了一块新土地！`, 'event');
                    break;
                }
            }
        }
    }
}

function nextDay() {
    if (gameState.nextDayCooldown > 0) {
        addLog(`请等待${gameState.nextDayCooldown}秒后再使用"下一天"。`, 'warning');
        return;
    }
    gameState.nextDayCooldown = 60;
    gameState.day++;
    updateWeather();
    updateMerchant();
    updateItemDurations();
    updateAuction();
    let growthMultiplier = 1.0;
    if (!gameState.activeEffects.greenhouse) {
        if (gameState.weather === "小雨") growthMultiplier = 1.2;
        else if (gameState.weather === "大雨") growthMultiplier = 1.4;
        else if (gameState.weather === "暴风雨") growthMultiplier = 0.8;
    }
    if (gameState.activeEffects.irrigationSystem) {
        gameState.plots.forEach(p => { if (p.planted && !p.watered && !p.sick) p.watered = true; });
    }
    let anyGrowth = false;
    gameState.plots.forEach(plot => {
        if (plot.planted && !plot.sick) {
            let dailyGrowth = 1.0;
            if (plot.watered) {
                dailyGrowth += gameState.activeEffects.goldenWateringCan ? 1.0 : 0.5;
                plot.watered = false;
            }
            plot.growthProgress += dailyGrowth * growthMultiplier;
            plot.growthStage = Math.floor(plot.growthProgress);
            const crop = allCrops.find(c => c.id === plot.crop);
            if (plot.growthStage > crop.growthTime) plot.growthStage = crop.growthTime;
            anyGrowth = true;
        }
    });
    checkProcessingProgress();
    randomEvent();
    for (let name in gameState.marketPrices) {
        let change = 0.9 + Math.random() * 0.2;
        gameState.marketPrices[name] = Math.max(1, Math.floor(gameState.marketPrices[name] * change));
    }
    addLog(`第${gameState.day}天开始了。天气: ${gameState.weather}`, 'info');
    if (anyGrowth) addLog(`作物生长了一天。`, 'info');
    renderGame();
}

function updateMerchant() {
    if (gameState.merchant.present) {
        gameState.merchant.daysRemaining--;
        if (gameState.merchant.daysRemaining <= 0) {
            gameState.merchant.present = false;
            addLog("植物商人离开了。", 'warning');
        }
    } else {
        gameState.merchant.nextVisit--;
        if (gameState.merchant.nextVisit <= 0) {
            gameState.merchant.present = true;
            gameState.merchant.daysRemaining = 1;
            gameState.merchant.priceMultiplier = 1.8 + Math.random() * 0.7;
            addLog("🧙 植物商人来了！快来出售你的农产品，价格极高！", 'event');
        }
    }
}

function updateItemDurations() {
    for (let id in gameState.mallItems) {
        let item = gameState.mallItems[id];
        if (!item.permanent && !item.consumable && item.daysLeft > 0) {
            item.daysLeft--;
            if (item.daysLeft <= 0) {
                const mallItem = mallItems.find(i => i.id == id);
                gameState.activeEffects[mallItem.effect] = false;
                addLog(`${mallItem.name}效果已结束。`, 'warning');
            }
        }
    }
}

function randomEvent() {
    const prob = 0.15 * gameState.eventFrequency;
    if (Math.random() > prob) return;
    const events = [
        { msg: "阳光充足，所有作物生长+1天！", action: () => gameState.plots.forEach(p => { if (p.planted && !p.sick) { p.growthProgress += 1; p.growthStage = Math.floor(p.growthProgress); } }) },
        { msg: "发现宝箱！获得100金币。", action: () => gameState.gold += 100 },
        { msg: "政府补贴，获得200金币。", action: () => gameState.gold += 200 },
        { msg: "病害爆发！", action: () => { let cnt=0; gameState.plots.forEach(p => { if(p.planted && !p.sick && Math.random()<0.3) { p.sick=true; cnt++; } }); if(cnt) addLog(`病害感染了${cnt}块地。`,'danger'); } },
        { msg: "小偷来了！", action: () => { if(!gameState.activeEffects.scarecrow) { let goldLost = Math.floor(gameState.gold*0.1); gameState.gold = Math.max(0, gameState.gold - goldLost); addLog(`小偷偷走了${goldLost}金币！`,'danger'); } } }
    ];
    const e = events[Math.floor(Math.random() * events.length)];
    e.action();
    addLog(`事件：${e.msg}`, 'event');
}

function checkProcessingProgress() {
    for (let i = gameState.processingItems.length-1; i>=0; i--) {
        const item = gameState.processingItems[i];
        if (gameState.day - item.startDay >= item.totalDays) {
            const product = factoryProducts.find(p => p.id === item.productId);
            gameState.completedItems.push({
                productId: item.productId,
                completedDay: gameState.day,
                quantity: item.quantity
            });
            gameState.processingItems.splice(i,1);
            addLog(`${product.name}加工完成！`, 'success');
        }
    }
}

function openMall() { renderMall(); document.getElementById('mall-dialog').style.display = 'flex'; }
function closeMall() { document.getElementById('mall-dialog').style.display = 'none'; }
function openFactory() { renderFactory(); document.getElementById('factory-dialog').style.display = 'flex'; }
function closeFactory() { document.getElementById('factory-dialog').style.display = 'none'; }
function openSkinSelector() { renderSkinSelector(); document.getElementById('skin-dialog').style.display = 'flex'; }
function closeSkinSelector() { document.getElementById('skin-dialog').style.display = 'none'; }

function renderMall() {
    const container = document.getElementById('mall-items');
    container.innerHTML = '';
    mallItems.forEach(item => {
        const purchased = gameState.mallItems[item.id].purchased;
        const active = gameState.activeEffects[item.effect];
        const div = document.createElement('div');
        div.className = 'mall-item';
        div.innerHTML = `
            <div><b>${item.icon} ${item.name}</b> - ${item.price}金币</div>
            <div>${item.description}</div>
            ${purchased ? '<div>✓ 已拥有</div>' : ''}
        `;
        const btn = document.createElement('button');
        btn.className = 'btn-small';
        if (purchased && item.permanent) {
            btn.textContent = '已拥有'; btn.disabled = true;
        } else if (active && !item.consumable && !item.permanent) {
            btn.textContent = '生效中'; btn.disabled = true;
        } else if (gameState.gold >= item.price) {
            btn.textContent = '购买';
            btn.onclick = () => buyMallItem(item.id);
        } else {
            btn.textContent = '金币不足'; btn.disabled = true;
        }
        div.appendChild(btn);
        container.appendChild(div);
    });
}

function buyMallItem(itemId) {
    const item = mallItems.find(i => i.id === itemId);
    if (gameState.gold < item.price) { addLog("金币不足！", 'warning'); return; }
    if (!hasStorageSpace(item.name, item.storageSize || 1)) { addLog("仓库空间不足！", 'warning'); return; }
    gameState.gold -= item.price;
    if (!gameState.inventory[item.name]) gameState.inventory[item.name] = { count: 0, selected: false, mallItem: true, itemData: item };
    gameState.inventory[item.name].count++;
    updateStorageUsage();
    addLog(`购买了${item.name}！`, 'success');
    renderGame();
    closeMall();
}

function renderFactory() {
    renderAvailableProducts();
    renderProcessingProducts();
    renderCompletedProducts();
}

function renderAvailableProducts() {
    const container = document.getElementById('available-products');
    container.innerHTML = '';
    const unlockedProducts = factoryProducts.filter(p => p.level <= gameState.level);
    unlockedProducts.forEach(product => {
        const canProduce = checkMaterials(product);
        const actualTime = gameState.activeEffects.factoryBoost ? Math.ceil(product.processingTime/2) : product.processingTime;
        const div = document.createElement('div');
        div.className = 'factory-product';
        div.innerHTML = `
            <div class="product-header"><span>${product.icon} ${product.name}</span><span>售价: ${product.sellPrice}</span></div>
            <div>${product.description}</div>
            <div>加工时间: ${actualTime}天  费用: ${product.processingCost}金币</div>
            <div>原料: ${product.requirements.map(r => `${r.amount}个${r.cropId ? allCrops.find(c=>c.id===r.cropId).name : factoryProducts.find(p=>p.id===r.productId).name}`).join(', ')}</div>
        `;
        const btn = document.createElement('button');
        btn.className = 'btn-small';
        if (canProduce && gameState.gold >= product.processingCost) {
            btn.textContent = '开始加工';
            btn.onclick = () => startProcessing(product.id);
        } else {
            btn.textContent = '条件不足'; btn.disabled = true;
        }
        div.appendChild(btn);
        container.appendChild(div);
    });
    if (container.children.length === 0) container.innerHTML = '<div>暂无可用加工产品</div>';
}

function renderProcessingProducts() {
    const container = document.getElementById('processing-products');
    container.innerHTML = '';
    gameState.processingItems.forEach((item, idx) => {
        const product = factoryProducts.find(p => p.id === item.productId);
        const progress = ((gameState.day - item.startDay) / item.totalDays) * 100;
        const remaining = item.totalDays - (gameState.day - item.startDay);
        const div = document.createElement('div');
        div.className = 'factory-product';
        div.innerHTML = `
            <div><b>${product.icon} ${product.name}</b> 剩余${remaining}天</div>
            <div class="processing-info"><div class="processing-progress"><div class="processing-progress-bar" style="width:${Math.min(progress,100)}%"></div></div><span>${Math.floor(progress)}%</span></div>
            <button class="btn-small" data-idx="${idx}">取消</button>
        `;
        div.querySelector('button').onclick = () => cancelProcessing(idx);
        container.appendChild(div);
    });
    if (container.children.length === 0) container.innerHTML = '<div>没有加工中的产品</div>';
}

function renderCompletedProducts() {
    const container = document.getElementById('completed-products');
    container.innerHTML = '';
    gameState.completedItems.forEach((item, idx) => {
        const product = factoryProducts.find(p => p.id === item.productId);
        const div = document.createElement('div');
        div.className = 'factory-product';
        div.innerHTML = `
            <div><b>${product.icon} ${product.name}</b> 数量: ${item.quantity}</div>
            <button class="btn-small" data-idx="${idx}">领取</button>
        `;
        div.querySelector('button').onclick = () => collectProduct(idx);
        container.appendChild(div);
    });
    if (container.children.length === 0) container.innerHTML = '<div>没有已完成的产品</div>';
}

function checkMaterials(product) {
    for (let req of product.requirements) {
        if (req.cropId) {
            const crop = allCrops.find(c => c.id === req.cropId);
            if (!gameState.inventory[crop.name] || gameState.inventory[crop.name].count < req.amount) return false;
        } else if (req.productId) {
            const p = factoryProducts.find(p => p.id === req.productId);
            if (!gameState.inventory[p.name] || gameState.inventory[p.name].count < req.amount) return false;
        }
    }
    return true;
}

function startProcessing(productId) {
    const product = factoryProducts.find(p => p.id === productId);
    if (!checkMaterials(product)) { addLog("原料不足！", 'warning'); return; }
    if (gameState.gold < product.processingCost) { addLog("金币不足！", 'warning'); return; }
    for (let req of product.requirements) {
        if (req.cropId) {
            const crop = allCrops.find(c => c.id === req.cropId);
            gameState.inventory[crop.name].count -= req.amount;
            if (gameState.inventory[crop.name].count === 0) delete gameState.inventory[crop.name];
        } else if (req.productId) {
            const p = factoryProducts.find(p => p.id === req.productId);
            gameState.inventory[p.name].count -= req.amount;
            if (gameState.inventory[p.name].count === 0) delete gameState.inventory[p.name];
        }
    }
    gameState.gold -= product.processingCost;
    const actualTime = gameState.activeEffects.factoryBoost ? Math.ceil(product.processingTime/2) : product.processingTime;
    gameState.processingItems.push({
        productId: product.id,
        startDay: gameState.day,
        totalDays: actualTime,
        quantity: 1
    });
    addLog(`开始加工${product.name}，需要${actualTime}天。`, 'success');
    renderGame();
    closeFactory();
}

function cancelProcessing(idx) {
    const item = gameState.processingItems[idx];
    const product = factoryProducts.find(p => p.id === item.productId);
    const progress = (gameState.day - item.startDay) / item.totalDays;
    for (let req of product.requirements) {
        let refund = Math.ceil(req.amount * (1 - progress));
        if (refund > 0) {
            if (req.cropId) {
                const crop = allCrops.find(c => c.id === req.cropId);
                addToStorage(crop.name, refund);
            } else if (req.productId) {
                const p = factoryProducts.find(p => p.id === req.productId);
                addToStorage(p.name, refund);
            }
        }
    }
    gameState.processingItems.splice(idx,1);
    addLog(`取消了${product.name}的加工，返还部分原料。`, 'warning');
    renderGame();
}

function collectProduct(idx) {
    const item = gameState.completedItems[idx];
    const product = factoryProducts.find(p => p.id === item.productId);
    if (addToStorage(product.name, item.quantity)) {
        gameState.completedItems.splice(idx,1);
        addLog(`领取了${product.name}。`, 'success');
        renderGame();
    } else {
        addLog("仓库空间不足！", 'warning');
    }
}

function renderSkinSelector() {
    const container = document.getElementById('skin-selector');
    container.innerHTML = '';
    gameSkins.forEach(skin => {
        const unlocked = gameState.unlockedSkins.includes(skin.id);
        const div = document.createElement('div');
        div.className = 'skin-item ' + (unlocked ? 'unlocked' : 'locked');
        if (unlocked && gameState.currentSkin === skin.id) div.classList.add('selected');
        div.innerHTML = `
            <div class="skin-preview" style="background:${skin.background};height:80px;border-radius:12px;"></div>
            <div class="skin-name">${skin.name}</div>
            <div>${skin.description}</div>
            ${unlocked ? '' : `<div>需要等级 ${skin.levelRequired}</div>`}
        `;
        if (unlocked) div.onclick = () => applySkin(skin.id);
        container.appendChild(div);
    });
}

function applySkin(skinId) {
    const skin = gameSkins.find(s => s.id === skinId);
    if (!skin) return;
    document.body.style.background = skin.background;
    gameState.currentSkin = skinId;
    addLog(`应用了皮肤: ${skin.name}`, 'success');
    closeSkinSelector();
}

function updateButtons() {
    const buyLandBtn = document.getElementById('buy-land-btn');
    const waterAllBtn = document.getElementById('water-all-btn');
    const harvestAllBtn = document.getElementById('harvest-all-btn');
    const upgradeStorageBtn = document.getElementById('upgrade-storage-btn');
    if (gameState.gold >= 100 && gameState.ownedPlots < gameState.totalPlots) buyLandBtn.disabled = false;
    else buyLandBtn.disabled = true;
    if (gameState.gold >= 20) waterAllBtn.disabled = false;
    else waterAllBtn.disabled = true;
    let hasReady = false;
    gameState.plots.forEach(plot => {
        if (plot.planted && !plot.sick) {
            const crop = allCrops.find(c => c.id === plot.crop);
            if (plot.growthStage >= crop.growthTime) hasReady = true;
        }
    });
    harvestAllBtn.disabled = !hasReady;
    if (gameState.gold >= 200) upgradeStorageBtn.disabled = false;
    else upgradeStorageBtn.disabled = true;
}

function setupEventListeners() {
    document.getElementById('next-day-btn').onclick = nextDay;
    document.getElementById('buy-land-btn').onclick = tryBuyLand;
    document.getElementById('water-all-btn').onclick = waterAllCrops;
    document.getElementById('harvest-all-btn').onclick = harvestAllCrops;
    document.getElementById('mall-btn').onclick = openMall;
    document.getElementById('factory-btn').onclick = openFactory;
    document.getElementById('upgrade-storage-btn').onclick = upgradeStorage;
    document.getElementById('skin-btn').onclick = openSkinSelector;
    document.getElementById('close-mall-btn').onclick = closeMall;
    document.getElementById('close-factory-btn').onclick = closeFactory;
    document.getElementById('close-skin-btn').onclick = closeSkinSelector;
    document.getElementById('sell-to-merchant-btn').onclick = sellToMerchant;
    document.getElementById('list-auction-btn').onclick = listAuctionItem;
    document.getElementById('clear-log-btn').onclick = () => { document.getElementById('log').innerHTML = ''; addLog("日志已清空。"); };
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCropsShop();
        };
    });
    document.querySelectorAll('.trade-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.trade-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.trade-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
        };
    });
    document.querySelectorAll('.factory-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.factory-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tab.dataset.tab}-products`).classList.add('active');
        };
    });
}

window.onload = initGame;
