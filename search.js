// ==================== 搜索与拼音匹配引擎 ====================
window.leleleSearch = function(query, games, lang, scope = 'all') {
    if (!query || query.trim() === '') {
        return games.map(g => ({ ...g, score: 0, matchHtml: null, matchType: null }));
    }

    const q = query.trim().toLowerCase();
    const results = [];

    // 提取查询词的汉字和拼音特征
    let qPinyin = '', qFirst = '';
    if (typeof pinyinPro !== 'undefined') {
        qPinyin = pinyinPro.pinyin(q, { toneType: 'none', type: 'array' }).join('');
        qFirst = pinyinPro.pinyin(q, { pattern: 'first', toneType: 'none', type: 'array' }).join('');
    }

    games.forEach(game => {
        let maxScore = 0;
        let matchedHtml = null;
        let bestType = null;

        const targets = [
            { str: game.name_zh || '', type: 'name' },
            { str: game.name_en || '', type: 'name' },
            { str: game.category_zh || '', type: 'category' },
            { str: game.category_en || '', type: 'category' },
            { str: game.author || '', type: 'author' }
        ].filter(t => t.str);

        for (const target of targets) {
            const str = target.str;
            const lowStr = str.toLowerCase();
            let currentScore = 0;

            if (lowStr === q) currentScore = 100;
            else if (lowStr.startsWith(q)) currentScore = 85;
            else if (lowStr.includes(q)) currentScore = 70;

            if (currentScore < 100 && typeof pinyinPro !== 'undefined') {
                const tPinyin = pinyinPro.pinyin(str, { toneType: 'none', type: 'array' }).join('');
                const tFirst = pinyinPro.pinyin(str, { pattern: 'first', toneType: 'none', type: 'array' }).join('');

                if (qPinyin.length >= 2 && tPinyin === qPinyin) currentScore = Math.max(currentScore, 65);
                else if (qPinyin.length >= 2 && tPinyin.includes(qPinyin)) currentScore = Math.max(currentScore, 60);
                else if (qFirst.length >= 2 && tFirst === qFirst) currentScore = Math.max(currentScore, 55);
                else if (qFirst.length >= 2 && tFirst.includes(qFirst)) currentScore = Math.max(currentScore, 50);
            }

            // 兜底：仅当完整查询按顺序连续命中时才计分（避免单字符/乱序造成"显示一大堆"）
            if (currentScore === 0 && q.length >= 2) {
                let qIdx = 0;
                for (let i = 0; i < str.length && qIdx < q.length; i++) {
                    if (str[i].toLowerCase() === q[qIdx]) qIdx++;
                }
                if (qIdx === q.length) currentScore = 40;
            }

            // 字段权重：标题 > 分类/标签 > 作者
            const weight = target.type === 'name' ? 1 : (target.type === 'category' ? 0.75 : 0.6);
            currentScore = Math.round(currentScore * weight);

            if (currentScore > maxScore) {
                maxScore = currentScore;
                bestType = target.type;
                if (currentScore >= 40 && (target.type === 'name' || target.type === 'author')) {
                    matchedHtml = highlightText(str, q, qPinyin);
                }
            }
        }

        if (maxScore > 0) {
            results.push({ ...game, score: maxScore, matchHtml: matchedHtml, matchType: bestType });
        }
    });

    // 按范围（全部 / 游戏 / 作者）筛选
    let scoped = results;
    if (scope === 'game') scoped = results.filter(r => r.matchType && r.matchType !== 'author');
    else if (scope === 'author') scoped = results.filter(r => r.matchType === 'author');

    // 去重 → 相关度排序 → 限额
    const seen = new Set();
    const deduped = [];
    for (const r of scoped) {
        const key = r.id != null ? `id:${r.id}` : `n:${r.name_zh || r.name_en}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(r);
    }
    deduped.sort((a, b) => b.score - a.score || a.id - b.id);
    return deduped.slice(0, 500);
};

// 作者索引搜索：按作者名/拼音匹配，返回 [{ author, games, score, matchHtml }]
window.leleleSearchAuthors = function(query, authors, games) {
    if (!query || query.trim() === '' || !authors) return [];

    const q = query.trim().toLowerCase();
    let qPinyin = '', qFirst = '';
    if (typeof pinyinPro !== 'undefined') {
        qPinyin = pinyinPro.pinyin(q, { toneType: 'none', type: 'array' }).join('');
        qFirst = pinyinPro.pinyin(q, { pattern: 'first', toneType: 'none', type: 'array' }).join('');
    }

    // 作者 ID → 作品列表
    const byAuthor = {};
    games.forEach(g => {
        const aid = g.authorId != null ? g.authorId : (g.author && /^\d+$/.test(String(g.author)) ? g.author : null);
        if (aid == null) return;
        (byAuthor[aid] = byAuthor[aid] || []).push(g);
    });

    const out = [];
    authors.forEach(a => {
        const targets = [
            { str: a.name_zh || '', type: 'name' },
            { str: a.name_en || '', type: 'name' }
        ].filter(t => t.str);

        let maxScore = 0, bestStr = '';
        for (const t of targets) {
            const lowStr = t.str.toLowerCase();
            let s = 0;
            if (lowStr === q) s = 100;
            else if (lowStr.startsWith(q)) s = 85;
            else if (lowStr.includes(q)) s = 70;

            if (s < 100 && typeof pinyinPro !== 'undefined') {
                const tp = pinyinPro.pinyin(t.str, { toneType: 'none', type: 'array' }).join('');
                const tf = pinyinPro.pinyin(t.str, { pattern: 'first', toneType: 'none', type: 'array' }).join('');
                if (qPinyin.length >= 2 && tp === qPinyin) s = Math.max(s, 65);
                else if (qPinyin.length >= 2 && tp.includes(qPinyin)) s = Math.max(s, 60);
                else if (qFirst.length >= 2 && tf === qFirst) s = Math.max(s, 55);
                else if (qFirst.length >= 2 && tf.includes(qFirst)) s = Math.max(s, 50);
            }

            if (s === 0 && q.length >= 2) {
                let qIdx = 0;
                for (let i = 0; i < t.str.length && qIdx < q.length; i++) {
                    if (t.str[i].toLowerCase() === q[qIdx]) qIdx++;
                }
                if (qIdx === q.length) s = 40;
            }

            if (s > maxScore) { maxScore = s; bestStr = t.str; }
        }

        if (maxScore >= 40) {
            out.push({ author: a, games: byAuthor[a.id] || [], score: maxScore, matchHtml: highlightText(bestStr, q, qPinyin) });
        }
    });

    out.sort((x, y) => y.score - x.score || y.games.length - x.games.length);
    return out.slice(0, 25);
};

// 高亮处理函数
function highlightText(text, query, qPinyin) {
    if (!text) return '';
    let res = text;

    if (/[\u4e00-\u9fa5]/.test(query)) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        res = res.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    else if (qPinyin && typeof pinyinPro !== 'undefined') {
        res = `<mark class="search-highlight">${text}</mark>`;
    }
    return res;
}
