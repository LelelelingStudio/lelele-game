(function () {
  const root = document.getElementById('top3RankContainer');
  const modalList = document.getElementById('rankModalList');
  const openBtn = document.getElementById('openRankModalBtn');
  const modal = document.getElementById('rankModalOverlay');
  const closeBtn = document.getElementById('rankModalCloseBtn');

  if (!root || !modalList) return;

  const language = () => (document.documentElement.getAttribute('data-lang') || 'zh').toLowerCase();

  function readString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function alt() {
    for (let i = 0; i < arguments.length; i += 1) {
      const value = readString(arguments[i]);
      if (value) return value;
    }
    return '';
  }

  function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function pickUrl(item) {
    const url = alt(
      item?.detailUrl,
      item?.detail_url,
      item?.gameUrl,
      item?.game_url,
      item?.url,
      item?.link,
      item?.href,
      item?.playUrl,
      item?.play_url,
      item?.pageUrl,
      item?.page_url
    );
    if (url) return url;

    const id = alt(item?.id, item?.gameId, item?.game_id, item?.slug, item?.code, item?.key);
    if (id) {
      return `game.html?id=${encodeURIComponent(id)}`;
    }

    return '#';
  }

  function pickName(item, currentLang) {
    if (currentLang === 'en') {
      return alt(
        item?.name_en,
        item?.nameEn,
        item?.en_name,
        item?.enName,
        item?.title_en,
        item?.titleEn,
        item?.game_en,
        item?.gameEn,
        item?.name,
        item?.title,
        item?.gameName,
        item?.game_name,
        item?.label
      ) || alt(item?.name, item?.title, item?.gameName, item?.game_name, item?.label);
    }

    return alt(
      item?.name_zh,
      item?.nameZh,
      item?.zh_name,
      item?.zhName,
      item?.title_zh,
      item?.titleZh,
      item?.game_zh,
      item?.gameZh,
      item?.name,
      item?.title,
      item?.gameName,
      item?.game_name,
      item?.label
    ) || alt(item?.name, item?.title, item?.gameName, item?.game_name, item?.label);
  }

  function pickScore(item) {
    return toNumber(
      alt(
        item?.score,
        item?.value,
        item?.count,
        item?.playCount,
        item?.plays,
        item?.views,
        item?.hot,
        item?.heat,
        item?.rankScore,
        item?.ranking,
        item?.popularity
      ),
      0
    );
  }

  function pickIcon(item) {
    return alt(item?.icon, item?.emoji, item?.symbol, item?.badge, item?.logo) || '🎮';
  }

  function normalizePayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const candidates = [
      payload.data,
      payload.result,
      payload.list,
      payload.games,
      payload.items,
      payload.records,
      payload.rows,
      payload.ranking,
      payload.top,
      payload.rankings
    ];

    for (let i = 0; i < candidates.length; i += 1) {
      if (Array.isArray(candidates[i])) return candidates[i];
    }

    const firstArray = Object.values(payload).find((value) => Array.isArray(value));
    return Array.isArray(firstArray) ? firstArray : [];
  }

  function renderEmptyState() {
    const message = language() === 'en' ? 'No data yet' : '暂无数据';
    root.innerHTML = '<div class="rank-empty">' + message + '</div>';
    modalList.innerHTML = '<li class="rank-empty" style="min-height: 80px;">' + message + '</li>';
  }

  function openModal() {
    if (modal) modal.classList.add('active');
  }

  function closeModal() {
    if (modal) modal.classList.remove('active');
  }

  function renderTopThree(items) {
    const safeItems = items.slice(0, 3);
    if (!safeItems.length) {
      renderEmptyState();
      return;
    }

    const currentLang = language();
    root.innerHTML = safeItems
      .map((item, index) => {
        const rank = index + 1;
        const name = pickName(item, currentLang) || (currentLang === 'en' ? 'Unnamed game' : '未命名游戏');
        const score = pickScore(item);
        const icon = pickIcon(item);
        const url = pickUrl(item);
        const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        const rankText = currentLang === 'en' ? 'Rank ' + rank : '第 ' + rank + ' 名';

        return `
          <a class="rank-card rank-${rank}" href="${url}" style="text-decoration:none;" aria-label="${name}">
            <div class="rank-card-header">
              <div class="rank-medal">${rankLabel}</div>
              <span class="rank-tag">${rankText}</span>
            </div>
            <div class="rank-main">
              <div class="rank-icon">${icon}</div>
              <div class="rank-name">${name}</div>
            </div>
            <div class="rank-meta">
              <div class="rank-count">${score.toLocaleString()} <small>${currentLang === 'en' ? 'hot' : '热度'}</small></div>
              <span class="rank-link">${currentLang === 'en' ? 'Open' : '进入'}</span>
            </div>
          </a>
        `;
      })
      .join('');
  }

  function renderModalList(items) {
    const currentLang = language();
    const list = items.slice(0, 25);

    if (!list.length) {
      modalList.innerHTML = '<li class="rank-empty" style="min-height: 80px;">' + (currentLang === 'en' ? 'No data yet' : '暂无数据') + '</li>';
      return;
    }

    modalList.innerHTML = list
      .map((item, index) => {
        const rank = index + 1;
        const name = pickName(item, currentLang) || (currentLang === 'en' ? 'Unnamed game' : '未命名游戏');
        const score = pickScore(item);
        const url = pickUrl(item);

        return `
          <li class="rank-modal-row">
            <span class="rank-modal-index">${rank}</span>
            <span class="rank-modal-name">${name}</span>
            <span class="rank-modal-count">${score.toLocaleString()}</span>
            <a class="rank-modal-link" href="${url}">${currentLang === 'en' ? 'Open' : '进入'}</a>
          </li>
        `;
      })
      .join('');
  }

  async function fetchRankings() {
    const currentLang = language();
    const endpoints = [
      `https://analytics.leleleling.site/gamecheck?lang=${currentLang}`,
      'https://analytics.leleleling.site/gamecheck',
      'https://analytics.leleleling.site/gamecheck?lang=zh',
      'https://analytics.leleleling.site/gamecheck?lang=en'
    ];

    let lastError = null;

    for (let i = 0; i < endpoints.length; i += 1) {
      try {
        const response = await fetch(endpoints[i], {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const text = await response.text();
        if (!text) {
          continue;
        }

        let payload = null;
        try {
          payload = JSON.parse(text);
        } catch (error) {
          payload = null;
        }

        if (!payload) {
          continue;
        }

        const items = normalizePayload(payload);
        if (!items.length) {
          renderEmptyState();
          return;
        }

        const orderedItems = [...items].sort((a, b) => toNumber(pickScore(b), 0) - toNumber(pickScore(a), 0));
        renderTopThree(orderedItems);
        renderModalList(orderedItems);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    renderEmptyState();
    if (window.console) {
      console.warn('[rank-loader] fetch failed', lastError);
    }
  }

  function bindEvents() {
    if (openBtn) {
      openBtn.addEventListener('click', openModal);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
      });
    }
  }

  bindEvents();
  fetchRankings();
  window.setInterval(fetchRankings, 5 * 60 * 1000);
})();
