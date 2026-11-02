window.LELELE_RECAPTCHA_CONFIG = Object.freeze({
    apiBaseUrl: ['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? 'http://localhost:3000'
        : 'https://recaptcha.leleleling.site/api/captcha',
    v3SiteKey: '6LfHsgouAAAAAE8zUug67cDntWXOnsWaokzjKvkd',
    v2SiteKey: '6LdHtQouAAAAAPBVLMiY9w6m2hX0Ty-5kx4mFeCm',
    statusCacheMs: 6 * 60 * 60 * 1000
});
