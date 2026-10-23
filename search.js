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
                
                if (tPinyin === qPinyin) currentScore = Math.max(currentScore, 65);
                else if (tPinyin.includes(qPinyin)) currentScore = Math.max(currentScore, 60);
                else if (tFirst === qFirst) currentScore = Math.max(currentScore, 55);
                else if (tFirst.includes(qFirst)) currentScore = Math.max(currentScore, 50);
            }

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

            if (currentScore > maxScore) {
                maxScore = currentScore;
                if (currentScore >= 50 && target.type === 'name') {
                    // 直接用全局函数调用，避免 this 丢失
                    matchedHtml = highlightText(str, q, qPinyin);
                }
            }
        }

        if (maxScore > 0) {
            results.push({ ...game, score: maxScore, matchHtml: matchedHtml });
        }
    });

    results.sort((a, b) => b.score - a.score || a.id - b.id);
    return results;
};

// 高亮处理函数独立出来
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
