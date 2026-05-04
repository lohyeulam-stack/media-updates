"""All platform source configurations — 6 categories, 20+ platforms, 30+ URLs."""

SOURCES = [
    # ═══════════════════════════════════════════
    # 1. 社交/短视频
    # ═══════════════════════════════════════════
    {
        "platform": "tiktok",
        "name": "TikTok for Business Blog",
        "url": "https://www.tiktok.com/business/en-US/blog",
        "wait_ms": 5000,
        "category": "social",
    },
    {
        "platform": "tiktok",
        "name": "TikTok What's New",
        "url": "https://ads.tiktok.com/help/blog",
        "wait_ms": 5000,
        "category": "social",
    },
    {
        "platform": "tiktok",
        "name": "TikTok Ads Blog (AU)",
        "url": "https://ads.tiktok.com/business/en-AU/blog",
        "wait_ms": 5000,
        "category": "social",
    },
    {
        "platform": "tiktok",
        "name": "TikTok Business API Changelog",
        "url": "https://business-api.tiktok.com/portal/docs/whats-new/v1.3",
        "wait_ms": 5000,
        "use_iframe": True,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Meta for Business News",
        "url": "https://www.facebook.com/business/news",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Meta Developers Blog",
        "url": "https://developers.facebook.com/blog/",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Meta Graph API Changelog",
        "url": "https://developers.facebook.com/docs/graph-api/changelog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Messenger Platform Changelog",
        "url": "https://developers.facebook.com/docs/messenger-platform/changelog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Instagram Platform Changelog",
        "url": "https://developers.facebook.com/docs/instagram-platform/changelog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Facebook Marketing API Changelog",
        "url": "https://developers.facebook.com/docs/marketing-api/changelog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Threads Platform Changelog",
        "url": "https://developers.facebook.com/docs/threads/changelog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "meta",
        "name": "Facebook Pages API Changelog",
        "url": "https://developers.facebook.com/docs/pages/changelog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "snapchat",
        "name": "Snapchat for Business Blog",
        "url": "https://forbusiness.snapchat.com/blog",
        "wait_ms": 3000,
        "category": "social",
    },
    {
        "platform": "snapchat",
        "name": "Snap Marketing API Changelog",
        "url": "https://developers.snap.com/api/marketing-api/Changelog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "pinterest",
        "name": "Pinterest Business Blog",
        "url": "https://business.pinterest.com/blog/",
        "wait_ms": 3000,
        "category": "social",
    },
    {
        "platform": "pinterest",
        "name": "Pinterest Newsroom",
        "url": "https://newsroom.pinterest.com/",
        "wait_ms": 5000,
        "category": "social",
    },
    {
        "platform": "x",
        "name": "X Business Blog",
        "url": "https://business.x.com/en/blog",
        "wait_ms": 4000,
        "category": "social",
    },
    {
        "platform": "linkedin",
        "name": "LinkedIn Marketing Blog",
        "url": "https://business.linkedin.com/marketing-solutions/blog",
        "wait_ms": 5000,
        "category": "social",
    },
    # ═══════════════════════════════════════════
    # 2. 搜索/应用商店
    # ═══════════════════════════════════════════
    {
        "platform": "google",
        "name": "Google Ads & Commerce Blog",
        "url": "https://blog.google/products/ads-commerce/",
        "wait_ms": 3000,
        "category": "search",
    },
    {
        "platform": "google",
        "name": "Google Ads Developer Blog",
        "url": "https://ads-developers.googleblog.com/",
        "wait_ms": 3000,
        "category": "search",
    },
    {
        "platform": "apple",
        "name": "Apple Search Ads Updates",
        "url": "https://searchads.apple.com/whats-new",
        "wait_ms": 4000,
        "category": "search",
    },
    # ═══════════════════════════════════════════
    # 3. 视频
    # ═══════════════════════════════════════════
    {
        "platform": "youtube",
        "name": "YouTube Official Blog",
        "url": "https://blog.youtube/",
        "wait_ms": 3000,
        "category": "video",
    },
    {
        "platform": "spotify",
        "name": "Spotify Ads",
        "url": "https://ads.spotify.com/en-US/news-and-inspiration/",
        "wait_ms": 5000,
        "category": "video",
    },
    # ═══════════════════════════════════════════
    # 4. 亚洲区域
    # ═══════════════════════════════════════════
    {
        "platform": "kwai",
        "name": "快手磁力引擎",
        "url": "https://e.kuaishou.com/",
        "wait_ms": 6000,
        "category": "asia",
    },
    {
        "platform": "line",
        "name": "LINE for Business",
        "url": "https://www.linebiz.com/jp/column/",
        "wait_ms": 4000,
        "category": "asia",
    },
    {
        "platform": "naver",
        "name": "Naver Search AD",
        "url": "https://searchad.naver.com/notice",
        "wait_ms": 4000,
        "category": "asia",
    },
    {
        "platform": "kakao",
        "name": "Kakao Business",
        "url": "https://business.kakao.com/info/notices",
        "wait_ms": 4000,
        "category": "asia",
    },
    # ═══════════════════════════════════════════
    # 5. 程序化/DSP
    # ═══════════════════════════════════════════
    {
        "platform": "dv360",
        "name": "Google Marketing Platform Blog",
        "url": "https://blog.google/products/marketingplatform/",
        "wait_ms": 3000,
        "category": "dsp",
    },
    {
        "platform": "applovin",
        "name": "AppLovin Blog",
        "url": "https://www.applovin.com/blog/",
        "wait_ms": 4000,
        "category": "dsp",
    },
    {
        "platform": "ironsource",
        "name": "Unity (ironSource) Blog",
        "url": "https://www.is.com/blog/",
        "wait_ms": 4000,
        "category": "dsp",
    },
    {
        "platform": "mintegral",
        "name": "Mintegral Blog",
        "url": "https://www.mintegral.com/en/blog",
        "wait_ms": 4000,
        "category": "dsp",
    },
    {
        "platform": "pangle",
        "name": "Pangle Help Center",
        "url": "https://www.pangleglobal.com/help/docs",
        "wait_ms": 4000,
        "category": "dsp",
    },
    {
        "platform": "amazon",
        "name": "Amazon Ads Blog",
        "url": "https://advertising.amazon.com/blog",
        "wait_ms": 5000,
        "category": "dsp",
    },
    # ═══════════════════════════════════════════
    # 6. 国内厂商海外渠道
    # ═══════════════════════════════════════════
    {
        "platform": "huawei",
        "name": "Huawei Ads Developer",
        "url": "https://developer.huawei.com/consumer/en/ads/",
        "wait_ms": 5000,
        "category": "cn-oem",
    },
    {
        "platform": "xiaomi",
        "name": "Xiaomi Global Developer",
        "url": "https://global.developer.mi.com/",
        "wait_ms": 5000,
        "category": "cn-oem",
    },
    {
        "platform": "oppo",
        "name": "OPPO Developer",
        "url": "https://developers.oppomobile.com/",
        "wait_ms": 5000,
        "category": "cn-oem",
    },
    {
        "platform": "vivo",
        "name": "vivo Developer",
        "url": "https://developer.vivo.com/",
        "wait_ms": 5000,
        "category": "cn-oem",
    },
]

CATEGORY_LABELS = {
    "social": "社交/短视频",
    "search": "搜索/应用商店",
    "video": "视频",
    "asia": "亚洲区域",
    "dsp": "程序化/DSP",
    "cn-oem": "国内厂商海外渠道",
}
