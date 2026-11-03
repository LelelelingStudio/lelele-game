window.LELELE_RECAPTCHA_CONFIG = Object.freeze({
    apiBaseUrl: ['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://localhost:3000'
        : 'https://recaptcha.leleleling.site/api/captcha',
    v3SiteKey: '6LfHsgouAAAAAE8zUug67cDntWXOnsWaokzjKvkd',
    v2SiteKey: '6LdHtQouAAAAAPBVLMiY9w6m2hX0Ty-5kx4mFeCm',
    // 多服务随机选择：按用户网络可达性探测后，在可用服务中随机挑一个
    hcaptchaSiteKey: 'adde87f8-395e-411c-83e0-ccd2656239d4',
    turnstileSiteKey: '0x4AAAAAAFxWPO67Am4mEsuh',
    probeTimeoutMs: 8000,
    statusCacheMs: 6 * 60 * 60 * 1000
});
