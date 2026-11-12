/* ==========================================================================
 * lelele-game · 平台「官方版」法律协议公共数据源（4.1.0 / 规则 5.0.0）
 *
 * 单一数据源：三份静态官方版协议页与 game.html 的协议弹窗共用。
 * 官方版口径：作者 ID 1「了了了岭工作室」自主开发运营的游戏为「官方游戏」，
 * 本平台即为开发者与运营方并承担相应责任；第三方游戏仍为展示/导航免责。
 * 12 款官方游戏（id 1,2,3,4,5,6,8,9,10,11,15,26）的 legal_urls 均缺省，
 * 由 game.html 自动挂载本协议，故措辞必须同时覆盖两类游戏。
 * 纯常量、零网络请求、无副作用 —— 离线/弱网/境外不可达时协议内容依然可读。
 * 渲染端统一使用 DOM API + textContent，不拼接未转义的 HTML。
 *
 * 形状：
 *   window.LELELE_GENERIC_AGREEMENTS[lang][type] = {
 *     title, subtitle, notice, liability,
 *     sections: [ { heading, paragraphs: [ ... ] } ]
 *   }
 *   lang: 'zh' | 'en'      type: 'eula' | 'privacy' | 'terms'
 * ========================================================================== */
(function () {
    'use strict';

    var LIABILITY = {
        zh: '本协议由了了了游官方提供，并区分两类游戏：由「了了了岭工作室」（作者 ID 1）自主开发、运营的「官方游戏」，本平台即为该游戏的开发者与运营方，依本协议承担相应责任；由第三方开发者提供的游戏，本平台仅提供展示与导航，不承担其运营及数据纠纷的连带责任。',
        en: 'These terms are provided officially by lelele Game and distinguish two categories of games. For an "Official Game" developed and operated in-house by Leleleling Studio (Author ID 1), the Platform is itself the developer and operator and assumes the corresponding responsibilities under these terms. For a game supplied by a third-party developer, the Platform provides display and navigation only and assumes no joint liability for its operation or for any data-related disputes.'
    };

    var NOTICE = {
        zh: '本协议为「了了了游官方版」法律文件，由本平台官方制定并提供，适用于平台官方自有游戏，并作为尚未提交专属法律协议之第三方游戏的兜底版本。若某款游戏已提供专属协议，请以游戏详情页右侧的协议入口为准。',
        en: 'This is the Official Version issued by lelele Game. It applies to the Platform\'s own Official Games and also serves as the fallback for third-party games that have not yet submitted dedicated legal agreements. If a dedicated agreement is available, please refer to the legal links on the game detail page.'
    };

    window.LELELE_GENERIC_AGREEMENTS = {
        zh: {
            eula: {
                title: '用户协议（了了了游官方版）',
                subtitle: '了了了游 · 官方游戏与未提交专属协议的游戏均适用 ｜ 生效日期：2026 年 11 月 15 日',
                notice: NOTICE.zh,
                liability: LIABILITY.zh,
                sections: [
                    {
                        heading: '第一条 · 协议范围',
                        paragraphs: [
                            '本协议适用于您通过「了了了游」（以下简称「本平台」）访问、浏览或体验本平台官方自有游戏，或由第三方开发者提供之游戏（以下统称「本游戏」）的行为。您点击开始游戏或使用本游戏，即视为已阅读并同意本协议。',
                            LIABILITY.zh,
                            '对于第三方游戏，本平台不托管其代码、账号体系与服务器，亦不参与其日常运营、充值、客服与数据管理；官方游戏由本平台直接开发与运营，相关事项依本平台《用户协议》《隐私政策》处理。'
                        ]
                    },
                    {
                        heading: '第二条 · 游戏内容与责任边界',
                        paragraphs: [
                            '官方游戏的名称、图标、截图、玩法说明、版本信息与链接由本平台自行提供并负责；第三方游戏的上述内容由其开发者提供，本平台仅作展示与导航。开发者应保证其提供的内容真实、合法且不侵犯他人权益。',
                            '因第三方游戏的内容、可用性、中断、数据丢失、账号纠纷或收费争议产生的问题，由该游戏的开发者或运营方负责处理，本平台在能力范围内提供联系渠道协助但不承担由此产生的赔偿责任；官方游戏的同类问题由本平台依本协议负责处理。'
                        ]
                    },
                    {
                        heading: '第三条 · 使用规范',
                        paragraphs: [
                            '您承诺不以任何方式对本游戏进行反向工程、恶意刷取、自动化攻击、传播恶意代码，或利用本游戏从事违反适用法律法规的活动。',
                            '若本游戏设有独立的账号、用户协议或隐私政策，您同时应遵守该游戏开发者制定的规则；两者冲突时，以该游戏专属协议就其内容优先适用。'
                        ]
                    },
                    {
                        heading: '第四条 · 数据与隐私',
                        paragraphs: [
                            '本平台仅在本站范围内为维持浏览体验所必需的最少信息（如语言偏好、收藏记录），相关处理见本平台《隐私政策》。',
                            '第三方游戏在运行中可能自行收集设备信息、Cookie 或账号数据，该等收集行为由其开发者独立负责，本平台无法亦不会读取、存储或转交；官方游戏仅在本站范围内处理维持浏览体验所必需的最少信息，详见本平台《隐私政策》。'
                        ]
                    },
                    {
                        heading: '第五条 · 变更与终止',
                        paragraphs: [
                            '本平台可因规则调整、合规要求或游戏下架而更新本协议或停止展示本游戏，更新后内容于本页面公布即生效。',
                            '若您不同意本协议，请停止使用本游戏；继续使用视为接受更新后的条款。'
                        ]
                    },
                    {
                        heading: '第六条 · 联系与争议',
                        paragraphs: [
                            '涉及本平台展示与导航服务、以及官方游戏内容、运营或数据的意见，可联系 leleleling@2980.com；涉及第三方游戏内容、运营或数据的争议，请直接联系该游戏的开发者。',
                            '本协议的解释与适用以适用法律法规为准；争议应首先友好协商解决。'
                        ]
                    }
                ]
            },
            privacy: {
                title: '隐私政策（了了了游官方版）',
                subtitle: '了了了游 · 官方游戏与未提交专属协议的游戏均适用 ｜ 生效日期：2026 年 11 月 15 日',
                notice: NOTICE.zh,
                liability: LIABILITY.zh,
                sections: [
                    {
                        heading: '第一条 · 说明',
                        paragraphs: [
                            '本政策说明「了了了游」在为您提供官方自有游戏、以及展示与导航第三方游戏时的信息处理原则，并说明第三方游戏自身可能进行的信息处理。',
                            LIABILITY.zh
                        ]
                    },
                    {
                        heading: '第二条 · 本平台收集的信息',
                        paragraphs: [
                            '本平台在本站范围内可能使用浏览器本地存储保存语言偏好、收藏、公告已读状态等设置，用于维持基本浏览体验；这些信息通常保存在您的设备本地。',
                            '开发者注册、认证、投稿与推荐等功能所提交的信息，按本平台《隐私政策》与《服务条款》处理，仅用于身份核对、内容审核与联系沟通。'
                        ]
                    },
                    {
                        heading: '第三条 · 游戏的数据处理',
                        paragraphs: [
                            '官方游戏由本平台直接开发与运营，运行于本站范围内，仅处理维持浏览体验所必需的最少信息（如语言偏好、收藏记录），不设置独立账号体系，具体见本平台《隐私政策》。第三方游戏由其开发者独立提供并运行，可能收集设备标识、浏览记录、Cookie、账号或支付相关信息，收集范围、用途、保存期限与第三方共享情况均由该开发者决定，并在其自身隐私政策中说明。',
                            '对于第三方游戏，本平台不托管其代码，不接收、不存储、不分析其产生的任何用户数据，也无法代为行使删除、导出或更正等权利，相关请求请直接向该游戏开发者提出；官方游戏的数据权利请求可向 leleleling@2980.com 提出。'
                        ]
                    },
                    {
                        heading: '第四条 · 外部链接',
                        paragraphs: [
                            '官方游戏在本站内运行，适用本平台的安全与隐私保护安排；点击第三方游戏后，您可能离开本站并进入第三方页面，该页面的安全策略、加密方式与隐私保护水平不受本平台控制，请自行判断并查阅其政策。'
                        ]
                    },
                    {
                        heading: '第五条 · 未成年人',
                        paragraphs: [
                            '未满法定年龄的用户应在监护人指导下使用本服务与各游戏；官方游戏的未成年人保护安排依本平台《隐私政策》执行，第三方游戏请向其开发者了解。'
                        ]
                    },
                    {
                        heading: '第六条 · 更新与联系',
                        paragraphs: [
                            '本政策可因合规要求更新，更新后于本页面公布。有关本平台自身信息处理的疑问，可联系 leleleling@2980.com。'
                        ]
                    }
                ]
            },
            terms: {
                title: '服务条款（了了了游官方版）',
                subtitle: '了了了游 · 官方游戏与未提交专属协议的游戏均适用 ｜ 生效日期：2026 年 11 月 15 日',
                notice: NOTICE.zh,
                liability: LIABILITY.zh,
                sections: [
                    {
                        heading: '第一条 · 服务性质',
                        paragraphs: [
                            '本平台为游戏导航与展示服务，为玩家提供发现入口、为独立开发者提供展示机会。对于第三方游戏，本平台不是其所有者、运营者或共同经营者；对于官方自有游戏，本平台即为开发者与运营者。',
                            LIABILITY.zh
                        ]
                    },
                    {
                        heading: '第二条 · 使用规则',
                        paragraphs: [
                            '您可按正常方式浏览、收藏与进入游戏，但不得批量抓取、镜像、篡改本平台页面，不得绕过展示逻辑或干扰其他用户使用。',
                            '您不得利用本平台提供的链接从事违法、侵权、欺诈、传播恶意代码或干扰第三方游戏正常运行的行为。'
                        ]
                    },
                    {
                        heading: '第三条 · 可用性与变更',
                        paragraphs: [
                            '第三方游戏可能因开发者调整而变更地址、暂停或停止服务，本平台不对链接的持续可用性作出保证。',
                            '本平台可基于合规审核、侵权投诉或安全原因，随时调整、隐藏或移除某款游戏的展示，无需事先通知。'
                        ]
                    },
                    {
                        heading: '第四条 · 知识产权',
                        paragraphs: [
                            '第三方游戏及其名称、美术、音乐、代码等权利归其开发者或原权利人所有；官方游戏及本平台页面、设计与文档的著作权归本平台所有。未经许可不得复制或商用。'
                        ]
                    },
                    {
                        heading: '第五条 · 责任限制',
                        paragraphs: [
                            '在法律允许的最大范围内，本平台对因使用或无法使用第三方游戏而产生的间接、附带或后果性损失不承担责任。',
                            '对于第三方游戏，本平台仅提供展示与导航，不承担其运营责任、内容责任与数据纠纷连带责任；官方游戏的运营与内容责任由本平台依本条款承担。'
                        ]
                    },
                    {
                        heading: '第六条 · 终止与适用法律',
                        paragraphs: [
                            '若您违反本条款，本平台可限制或终止向您提供部分服务。本条款的订立、履行与解释适用相关法律法规，争议应友好协商解决。'
                        ]
                    }
                ]
            }
        },
        en: {
            eula: {
                title: 'End User License Agreement (lelele Game Official Version)',
                subtitle: 'lelele Game · Official Games and games without a dedicated agreement ｜ Effective November 15, 2026',
                notice: NOTICE.en,
                liability: LIABILITY.en,
                sections: [
                    {
                        heading: '1. Scope',
                        paragraphs: [
                            'This Agreement governs your access to and use of an Official Game developed by the Platform, or a game provided by a third-party developer (together the "Game"), through lelele Game (the "Platform"). By launching or using the Game, you accept this Agreement.',
                            LIABILITY.en,
                            'For a third-party game, the Platform does not host its code, account system or servers and does not participate in its daily operation, payments, support or data management. For an Official Game, the Platform is itself the developer and operator, and such matters are governed by the Platform\'s User Agreement and Privacy Policy.'
                        ]
                    },
                    {
                        heading: '2. Game Content and Liability',
                        paragraphs: [
                            'For an Official Game, its name, icon, screenshots, description, version information and link are supplied and maintained by the Platform itself. For a third-party game, such content is supplied by its developer and the Platform merely displays and links to it. Developers are responsible for ensuring the content they supply is accurate, lawful and non-infringing.',
                            'Issues arising from a third-party game\'s content, availability, interruption, data loss, account disputes or payment controversies are handled by that game\'s developer or operator; the Platform may provide contact assistance but bears no liability for them. Equivalent issues concerning an Official Game are handled by the Platform under this Agreement.'
                        ]
                    },
                    {
                        heading: '3. Acceptable Use',
                        paragraphs: [
                            'You agree not to reverse engineer, exploit, attack with automation, distribute malicious code through, or otherwise use the Game for any unlawful purpose.',
                            'If the Game maintains its own accounts, terms or policies, you must also comply with them. Where they conflict with this Agreement, the Game\'s dedicated terms prevail with respect to that Game.'
                        ]
                    },
                    {
                        heading: '4. Data and Privacy',
                        paragraphs: [
                            'Within this site, the Platform uses only the minimum information necessary for browsing (such as language preference and favourites), as described in the Platform\'s Privacy Policy.',
                            'A third-party game may independently collect device information, cookies or account data; such processing is the sole responsibility of its developer and the Platform does not read, store or forward it. An Official Game processes only the minimum information necessary to maintain the browsing experience within this site, as described in the Platform\'s Privacy Policy.'
                        ]
                    },
                    {
                        heading: '5. Changes and Termination',
                        paragraphs: [
                            'The Platform may update this Agreement or stop listing the Game due to rule changes, compliance requirements or delisting. Updates take effect upon publication on this page.',
                            'If you do not agree, please stop using the Game; continued use constitutes acceptance.'
                        ]
                    },
                    {
                        heading: '6. Contact and Disputes',
                        paragraphs: [
                            'For matters concerning the Platform\'s display and navigation service or an Official Game\'s content, operation or data, contact leleleling@2980.com. For disputes about a third-party game, please contact its developer directly.',
                            'This Agreement is governed by applicable law; disputes should first be resolved amicably.'
                        ]
                    }
                ]
            },
            privacy: {
                title: 'Privacy Policy (lelele Game Official Version)',
                subtitle: 'lelele Game · Official Games and games without a dedicated policy ｜ Effective November 15, 2026',
                notice: NOTICE.en,
                liability: LIABILITY.en,
                sections: [
                    {
                        heading: '1. Introduction',
                        paragraphs: [
                            'This Policy explains how lelele Game handles information when providing its own Official Games and when displaying and linking to third-party games, and how third-party games may handle information themselves.',
                            LIABILITY.en
                        ]
                    },
                    {
                        heading: '2. Information the Platform Collects',
                        paragraphs: [
                            'Within this site, the Platform may use browser local storage for language preference, favourites and announcement read state in order to maintain a basic browsing experience. Such data generally remains on your device.',
                            'Information submitted for creator registration, verification, submissions and recommendations is handled under the Platform\'s Privacy Policy and Terms of Service, and used only for identity verification, review and communication.'
                        ]
                    },
                    {
                        heading: '3. Data Processing by Games',
                        paragraphs: [
                            'Official Games are developed and operated by the Platform and run within this site; they process only the minimum information necessary for browsing (such as language preference and favourites), have no separate account system, and are covered by the Platform\'s Privacy Policy. A third-party game is provided and operated independently by its developer and may collect device identifiers, browsing records, cookies, account or payment data; the scope, purpose, retention and sharing of such data are determined by that developer and described in its own privacy policy.',
                            'For a third-party game, the Platform does not host its code and does not receive, store or analyse any user data it generates, nor can it act on deletion, export or correction requests; please direct those to the developer. Data-rights requests concerning an Official Game may be sent to leleleling@2980.com.'
                        ]
                    },
                    {
                        heading: '4. External Links',
                        paragraphs: [
                            'Official Games run within this site and are covered by the Platform\'s security and privacy arrangements. Launching a third-party game may take you to an external site whose security practices, encryption and privacy protection are outside the Platform\'s control; please review its policies yourself.'
                        ]
                    },
                    {
                        heading: '5. Minors',
                        paragraphs: [
                            'Users below the applicable legal age should use this service and all games under parental guidance. Protections for minors in Official Games follow the Platform\'s Privacy Policy; for third-party games, please consult the respective developer.'
                        ]
                    },
                    {
                        heading: '6. Updates and Contact',
                        paragraphs: [
                            'This Policy may be updated for compliance reasons; updates are published on this page. Questions about the Platform\'s own data handling may be sent to leleleling@2980.com.'
                        ]
                    }
                ]
            },
            terms: {
                title: 'Terms of Service (lelele Game Official Version)',
                subtitle: 'lelele Game · Official Games and games without dedicated terms ｜ Effective November 15, 2026',
                notice: NOTICE.en,
                liability: LIABILITY.en,
                sections: [
                    {
                        heading: '1. Nature of the Service',
                        paragraphs: [
                            'The Platform is a game discovery and listing service: an entry point for players and a showcase for independent developers. For a third-party game the Platform is not its owner, operator or co-operator; for an Official Game the Platform is itself the developer and operator.',
                            LIABILITY.en
                        ]
                    },
                    {
                        heading: '2. Rules of Use',
                        paragraphs: [
                            'You may browse, bookmark and launch games in the ordinary manner, but may not scrape, mirror or alter the Platform\'s pages, bypass its display logic, or interfere with other users.',
                            'You may not use links provided by the Platform for unlawful, infringing, fraudulent, malicious-code or disruptive activities.'
                        ]
                    },
                    {
                        heading: '3. Availability and Changes',
                        paragraphs: [
                            'Third-party games may change address, pause or cease service at the developer\'s discretion; the Platform does not guarantee continuous link availability.',
                            'The Platform may adjust, hide or remove a listing at any time for compliance review, infringement complaints or security reasons, without prior notice.'
                        ]
                    },
                    {
                        heading: '4. Intellectual Property',
                        paragraphs: [
                            'A third-party game and its name, artwork, music and code remain the property of its developer or original rights holder. Official Games, together with the Platform\'s pages, design and documents, belong to the Platform. No reproduction or commercial use is permitted without permission.'
                        ]
                    },
                    {
                        heading: '5. Limitation of Liability',
                        paragraphs: [
                            'To the maximum extent permitted by law, the Platform is not liable for indirect, incidental or consequential loss arising from the use of, or inability to use, a third-party game.',
                            'For third-party games the Platform provides display and navigation only and assumes no operational, content or data-dispute liability. For Official Games, operational and content responsibilities are assumed by the Platform under these Terms.'
                        ]
                    },
                    {
                        heading: '6. Termination and Governing Law',
                        paragraphs: [
                            'The Platform may restrict or terminate part of its service if you breach these Terms. These Terms are governed by applicable law; disputes should first be resolved amicably.'
                        ]
                    }
                ]
            }
        }
    };

    // 模板中心与导出共同使用的来源声明（Apache-2.0 开源授权要求保留）
    window.LELELE_LEGAL_ATTRIBUTION = {
        zh: '本法律条款由了了了游提供',
        en: 'These legal terms are provided by lelele Game'
    };
})();
