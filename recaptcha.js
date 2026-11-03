(function() {
    'use strict';

    const config = window.LELELE_RECAPTCHA_CONFIG;
    if (!config) {
        console.error('Missing LELELE_RECAPTCHA_CONFIG');
        return;
    }

    const ACTIONS = new Set(['login', 'register', 'periodic_reverify']);
    const CACHE_KEY = 'lelele_captcha_status';
    const BREAKER_KEY = 'lelele_rc_breaker';
    const BREAKER_LIMIT = 3; // internal/服务端错误累计达到该值即熔断，停止验证
    let googleLoadPromise = null;
    let configPromise = null;
    let modalPromise = null;

    function isEnglish() {
        return document.documentElement.getAttribute('data-lang') === 'en';
    }

    function text(zh, en) {
        return isEnglish() ? en : zh;
    }

    function apiUrl(path) {
        return config.apiBaseUrl.replace(/\/$/, '') + path;
    }

    // 轻量 toast，用于熔断时提示
    function toast(message, ms) {
        ms = ms || 3600;
        let el = document.getElementById('leleleCaptchaToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'leleleCaptchaToast';
            el.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:rgba(15,23,42,.92);color:#fff;padding:12px 22px;border-radius:30px;font-size:14px;font-weight:600;z-index:10006;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:88%;text-align:center;';
            document.body.appendChild(el);
        }
        el.textContent = message;
        requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(16px)'; }, ms);
    }

    // ===== 熔断计数（会话级）=====
    function getBreakerCount() {
        const v = parseInt(sessionStorage.getItem(BREAKER_KEY) || '0', 10);
        return Number.isFinite(v) ? v : 0;
    }
    function recordFailure() {
        const c = getBreakerCount() + 1;
        try { sessionStorage.setItem(BREAKER_KEY, String(c)); } catch (e) {}
        if (c >= BREAKER_LIMIT) {
            toast(text('安全验证服务暂时不可用，已为你跳过验证', 'The verification service is temporarily unavailable; this check was skipped.'));
            return true;
        }
        return false;
    }
    function recordSuccess() {
        if (getBreakerCount() !== 0) { try { sessionStorage.setItem(BREAKER_KEY, '0'); } catch (e) {} }
    }
    function isBreakerOpen() { return getBreakerCount() >= BREAKER_LIMIT; }

    // 判断是否为服务端/internal 错误（应计入熔断、而非用户重试）
    function isServerError(err) {
        if (!err) return false;
        if (err.code === 'verification_unavailable') return true;
        if (err.status && err.status >= 500) return true;
        if (!err.status) return true; // 网络层失败（无 HTTP 状态）
        return false;
    }
    function makeServerError(code) {
        const e = new Error(text('安全验证服务暂时不可用，请稍后再试', 'Verification service is temporarily unavailable. Please try again later.'));
        e.code = code || 'service_unavailable';
        e.status = 503;
        return e;
    }

    async function fetchJson(path, options) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response;
        try {
            response = await fetch(apiUrl(path), Object.assign({ signal: controller.signal }, options));
        } catch (e) {
            clearTimeout(timeout);
            const err = new Error(text('安全验证服务暂时无法连接，请稍后重试', 'Security verification is temporarily unavailable. Please retry.'));
            err.code = 'network_error';
            throw err;
        }
        clearTimeout(timeout);

        let payload = {};
        try { payload = await response.json(); } catch (e) {}

        if (!response.ok) {
            // 结构化诊断：便于对照后端日志
            console.warn('[reCAPTCHA] 接口返回非 2xx:', {
                path,
                status: response.status,
                error: payload.error || null,
                decision: payload.decision || null
            });
            const error = new Error(payload.error || text('安全验证失败，请重试', 'Security verification failed. Please retry.'));
            error.code = payload.error;
            error.status = response.status;
            error.decision = payload.decision;
            throw error;
        }
        return payload;
    }

    function getRemoteConfig(force) {
        if (!configPromise || force) {
            configPromise = fetchJson('/config', {
                method: 'GET',
                headers: { Accept: 'application/json' },
                cache: 'no-store'
            }).catch((error) => {
                configPromise = null;
                throw error;
            });
        }
        return configPromise;
    }

    function loadGoogle() {
        if (window.grecaptcha) return Promise.resolve(window.grecaptcha);
        if (googleLoadPromise) return googleLoadPromise;

        googleLoadPromise = new Promise((resolve, reject) => {
            const existing = document.getElementById('lelele-recaptcha-api');
            const script = existing || document.createElement('script');
            const timeout = setTimeout(() => reject(new Error(text('Google 验证加载超时', 'Google verification timed out'))), 15000);

            script.onload = () => {
                if (!window.grecaptcha) {
                    clearTimeout(timeout);
                    reject(new Error(text('Google 验证加载失败', 'Failed to load Google verification')));
                    return;
                }
                window.grecaptcha.ready(() => {
                    clearTimeout(timeout);
                    resolve(window.grecaptcha);
                });
            };
            script.onerror = () => {
                clearTimeout(timeout);
                googleLoadPromise = null;
                reject(new Error(text('Google 验证加载失败', 'Failed to load Google verification')));
            };

            if (!existing) {
                script.id = 'lelele-recaptcha-api';
                script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(config.v3SiteKey)}`;
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            }
        });
        return googleLoadPromise;
    }

    async function executeV3(action) {
        const grecaptcha = await loadGoogle();
        return grecaptcha.execute(config.v3SiteKey, { action });
    }

    function setInlineState(container, state, message) {
        if (!container) return;
        container.classList.toggle('active', state === 'v2' || state === 'error');
        container.dataset.state = state;
        const status = container.querySelector('.recaptcha-inline-status');
        // 去重：错误文案只在弹层里显示，内联容器不再重复展示原始错误码
        if (status) status.textContent = (state === 'error') ? '' : (message || '');
    }

    // 带熔断 + 1 次重试的 /verify 调用
    async function verifyToken(token, action, mode) {
        // 熔断已开启：直接放行，不再请求
        if (isBreakerOpen()) {
            return { decision: 'pass', mode: 'bypass', ticket: null, skipped: true, reason: 'breaker_open' };
        }

        let lastErr = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const result = await fetchJson('/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({ token, action, mode })
                });
                if (result.decision === 'reject' && result.error === 'verification_unavailable') {
                    throw makeServerError('verification_unavailable');
                }
                if (result.decision === 'reject') {
                    recordSuccess();
                    return result;
                }
                recordSuccess();
                return result;
            } catch (err) {
                lastErr = err;
                if (!isServerError(err)) { recordSuccess(); throw err; } // 非服务端错误（如用户未通过）不计入熔断
                if (attempt === 0) continue; // 仅对服务端错误重试一次
            }
        }
        // 重试仍失败：计入熔断
        if (recordFailure()) {
            return { decision: 'pass', mode: 'bypass', ticket: null, skipped: true, reason: 'breaker_open' };
        }
        throw lastErr || makeServerError();
    }

    async function executeV2(action, container) {
        if (!container) throw new Error(text('缺少验证码容器', 'Captcha container is missing'));
        const grecaptcha = await loadGoogle();
        setInlineState(container, 'v2', text('请完成下方验证', 'Please complete the check below'));
        const previousHost = container.querySelector('.recaptcha-v2-host');
        const host = document.createElement('div');
        host.className = 'recaptcha-v2-host';
        if (previousHost) previousHost.replaceWith(host);
        else container.appendChild(host);

        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (callback, value) => {
                if (settled) return;
                settled = true;
                callback(value);
            };

            try {
                grecaptcha.render(host, {
                    sitekey: config.v2SiteKey,
                    theme: document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light',
                    callback: async (token) => {
                        try {
                            setInlineState(container, 'v2', text('正在确认…', 'Confirming…'));
                            const result = await verifyToken(token, action, 'v2');
                            if (result.decision !== 'pass' || !result.ticket) throw new Error(text('验证未通过，请重试', 'Verification failed. Please retry.'));
                            setInlineState(container, 'passed', text('验证已通过', 'Verification passed'));
                            finish(resolve, result);
                        } catch (error) {
                            setInlineState(container, 'error', '');
                            finish(reject, error);
                        }
                    },
                    'expired-callback': () => finish(reject, new Error(text('验证已过期，请重试', 'Verification expired. Please retry.'))),
                    'error-callback': () => finish(reject, new Error(text('验证组件加载失败，请重试', 'Verification widget failed. Please retry.')))
                });
            } catch (error) {
                finish(reject, error);
            }
        });
    }

    async function ensure(action, options = {}) {
        if (!ACTIONS.has(action)) throw new Error('Unsupported captcha action');
        const container = options.container || null;
        const onState = typeof options.onState === 'function' ? options.onState : () => {};
        onState('checking');
        setInlineState(container, 'checking', text('正在进行安全验证…', 'Running security check…'));

        const remoteConfig = await getRemoteConfig();
        if (!remoteConfig.required) {
            const bypass = await verifyToken('', action, 'bypass');
            if (bypass.decision !== 'pass') throw new Error(text('地区验证状态确认失败', 'Failed to confirm regional verification status'));
            onState('passed');
            return bypass;
        }

        let result;
        try {
            const token = await executeV3(action);
            result = await verifyToken(token, action, 'v3');
        } catch (error) {
            // 熔断开启时，将本次验证降级为放行
            if (isBreakerOpen()) {
                onState('passed');
                return { decision: 'pass', mode: 'bypass', ticket: null, skipped: true, reason: 'breaker_open' };
            }
            setInlineState(container, 'error', '');
            throw error;
        }

        // 熔断放行（v3 正常返回路径）：直接通过，不再校验 ticket
        if (result && result.skipped) {
            onState('passed');
            return result;
        }

        if (result.decision === 'pass' && result.ticket) {
            setInlineState(container, 'passed', text('验证已通过', 'Verification passed'));
            onState('passed');
            return result;
        }

        if (result.decision === 'need_v2') {
            onState('v2');
            const v2Result = await executeV2(action, container);
            onState('passed');
            return v2Result;
        }

        throw new Error(text('安全验证未通过，请重试', 'Security verification failed. Please retry.'));
    }

    function clearStatusCache() {
        try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
    }

    async function consume(ticket, action, session) {
        if (!session?.access_token) throw new Error(text('登录状态无效，请重新登录', 'Invalid session. Please sign in again.'));
        const result = await fetchJson('/consume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ ticket, action })
        });
        clearStatusCache();
        return result;
    }

    function readStatusCache(userId) {
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
            if (!cached || cached.userId !== userId || cached.expiresAt <= Date.now()) return null;
            return cached.data;
        } catch {
            return null;
        }
    }

    function writeStatusCache(userId, data) {
        if (data.due) return;
        let expiresAt = Date.now() + (config.statusCacheMs || 21600000);
        const dueAt = Date.parse(data.nextDueAt);
        if (Number.isFinite(dueAt)) expiresAt = Math.min(expiresAt, dueAt);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, data, expiresAt })); } catch (e) {}
    }

    async function getStatus(session, options = {}) {
        if (!session?.user?.id || !session.access_token) throw new Error(text('登录状态无效', 'Invalid session'));
        const cached = options.force ? null : readStatusCache(session.user.id);
        if (cached) return cached;

        const result = await fetchJson('/status', {
            method: 'GET',
            headers: { Accept: 'application/json', Authorization: `Bearer ${session.access_token}` },
            cache: 'no-store'
        });
        writeStatusCache(session.user.id, result);
        return result;
    }

    function buildInlineContainer() {
        const container = document.createElement('div');
        container.className = 'recaptcha-inline active';
        container.innerHTML = `
            <p class="recaptcha-inline-status">${text('请完成人机验证', 'Please complete the security check')}</p>
            <div class="recaptcha-v2-host"></div>
        `;
        return container;
    }

    function showReverificationModal(session) {
        if (modalPromise) return modalPromise;
        modalPromise = new Promise((resolve, reject) => {
            const overlay = document.createElement('div');
            overlay.className = 'recaptcha-modal-overlay active';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.innerHTML = `
                <div class="recaptcha-modal">
                    <div class="recaptcha-shield" aria-hidden="true">✓</div>
                    <h2><span class="zh-inline">安全复验</span><span class="en-inline">Security Check</span></h2>
                    <p class="recaptcha-modal-copy">
                        <span class="zh-inline">为了保护您的账号，请完成每 7 天一次的安全验证。</span>
                        <span class="en-inline">To protect your account, please complete the security check required every 7 days.</span>
                    </p>
                    <div class="recaptcha-modal-progress"><span></span></div>
                    <div class="recaptcha-modal-status">${text('正在进行无感验证…', 'Running a background check…')}</div>
                    <div class="recaptcha-modal-widget"></div>
                    <button type="button" class="recaptcha-retry" hidden>${text('重试', 'Retry')}</button>
                    <p class="recaptcha-terms">
                        <span class="zh-inline">本网站受 reCAPTCHA 保护，并适用 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 隐私权政策</a> 和 <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">服务条款</a>。</span>
                        <span class="en-inline">This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.</span>
                    </p>
                </div>
            `;
            document.body.appendChild(overlay);
            const status = overlay.querySelector('.recaptcha-modal-status');
            const retry = overlay.querySelector('.recaptcha-retry');
            const widgetArea = overlay.querySelector('.recaptcha-modal-widget');
            const inline = buildInlineContainer();
            widgetArea.appendChild(inline);

            const finishPass = () => {
                overlay.classList.add('leaving');
                setTimeout(() => overlay.remove(), 220);
                modalPromise = null;
                resolve(true);
            };

            const run = async () => {
                retry.hidden = true;
                status.textContent = text('正在进行无感验证…', 'Running a background check…');
                try {
                    const result = await ensure('periodic_reverify', {
                        container: inline,
                        onState(state) {
                            if (state === 'v2') status.textContent = text('需要进一步确认', 'One more check is required');
                            if (state === 'passed') status.textContent = text('验证已通过，正在继续…', 'Verified. Continuing…');
                        }
                    });
                    // 熔断放行：跳过 consume 直接通过
                    if (result.skipped) { finishPass(); return; }
                    await consume(result.ticket, 'periodic_reverify', session);
                    finishPass();
                } catch (error) {
                    const server = isServerError(error);
                    status.textContent = server
                        ? text('安全验证服务暂时不可用，已为你跳过验证', 'Verification service is temporarily unavailable; this check was skipped.')
                        : (error.message || text('验证失败，请重试', 'Verification failed. Please retry.'));
                    retry.hidden = false;
                }
            };

            retry.addEventListener('click', run);
            run().catch((error) => {
                overlay.remove();
                modalPromise = null;
                reject(error);
            });
        });
        return modalPromise;
    }

    async function requireCurrentVerification(session) {
        const status = await getStatus(session, { force: true });
        if (!status.required || !status.due) return status;
        await showReverificationModal(session);
        return getStatus(session, { force: true });
    }

    async function showReminderIfDue(session) {
        const status = await getStatus(session);
        if (!status.required || !status.due || document.querySelector('.recaptcha-reminder')) return status;
        const reminder = document.createElement('div');
        reminder.className = 'recaptcha-reminder';
        reminder.innerHTML = `
            <span><span class="zh-inline">账号安全验证已到期，请在进入开发者面板前完成复验。</span><span class="en-inline">Your account security check is due. Verify before opening the dashboard.</span></span>
            <a href="dashboard.html?security_check=1"><span class="zh-inline">现在验证</span><span class="en-inline">Verify now</span></a>
        `;
        document.body.appendChild(reminder);
        return status;
    }

    window.LeleleCaptcha = Object.freeze({
        clearStatusCache,
        consume,
        ensure,
        getStatus,
        requireCurrentVerification,
        showReminderIfDue,
        showReverificationModal
    });
})();
