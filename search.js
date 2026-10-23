// ==================== 搜索与拼音匹配引擎 ====================
window.leleleSearch = function(query, games, lang) {
    if (!query || query.trim() === '') {
        return games.map(g => ({ ...g, score: 0, matchHtml: null }));
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

        // 需要匹配的字段组合
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

            // 1. 中文/英文直接匹配
            if (lowStr === q) currentScore = 100;
            else if (lowStr.startsWith(q)) currentScore = 85;
            else if (lowStr.includes(q)) currentScore = 70;

            // 2. 拼音匹配 (仅在中文未完美匹配时触发)
            if (currentScore < 100 && typeof pinyinPro !== 'undefined') {
                const tPinyin = pinyinPro.pinyin(str, { toneType: 'none', type: 'array' }).join('');
                const tFirst = pinyinPro.pinyin(str, { pattern: 'first', toneType: 'none', type: 'array' }).join('');
                
                if (tPinyin === qPinyin) currentScore = Math.max(currentScore, 65);
                else if (tPinyin.includes(qPinyin)) currentScore = Math.max(currentScore, 60);
                else if (tFirst === qFirst) currentScore = Math.max(currentScore, 55);
                else if (tFirst.includes(qFirst)) currentScore = Math.max(currentScore, 50);
            }

            // 3. 散列顺序匹配 (如搜“爱农”匹配“爱种地的农民”)
            if (currentScore === 0) {
                let matchCount = 0;
                let qIdx = 0;
                for (let i = 0; i < str.length && qIdx < q.length; i++) {
                    if (str[i].toLowerCase() === q[qIdx]) {
                        matchCount++;
                        qIdx++;
                    }
                }
                if (matchCount > 0) currentScore = 10 + matchCount * 5;
            }

            // 更新最高分和高亮 HTML
            if (currentScore > maxScore) {
                maxScore = currentScore;
                // 如果分数够高，生成高亮
                if (currentScore >= 50 && target.type === 'name') {
                    matchedHtml = this.highlight(str, q, qPinyin);
                }
            }
        }

        if (maxScore > 0) {
            results.push({ ...game, score: maxScore, matchHtml: matchedHtml });
        }
    });

    // 排序：分数降序 -> ID升序
    results.sort((a, b) => b.score - a.score || a.id - b.id);
    return results;
};

// 高亮处理函数
window.leleleSearch.highlight = function(text, query, qPinyin) {
    if (!text) return '';
    let res = text;
    
    // 1. 中文高亮
    if (/[\u4e00-\u9fa5]/.test(query)) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        res = res.replace(regex, '<mark class="search-highlight">$1</mark>');
    } 
    // 2. 拼音高亮 (当匹配到拼音时，高亮对应的汉字)
    else if (qPinyin && typeof pinyinPro !== 'undefined') {
        // 这里做一个简化：如果搜的是拼音，把整个匹配的词高亮，方便用户看到
        res = `<mark class="search-highlight">${text}</mark>`;
    }
    return res;
};
