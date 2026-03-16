// 优先从本地缓存读取语言，如果是第一次访问，这里为 null
let currentLang = localStorage.getItem('siteLang'); 
let translations = {};

// 加载语言包
async function loadLanguage(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) throw new Error('Network response was not ok');
        translations[lang] = await response.json();
        
        // 传入 true 表示立即显示，防止闪烁
        updateDOM(lang, true); 
    } catch (error) {
        console.error('加载语言包失败:', error);
    }
}

// 手动切换语言
function changeLanguage(lang) {
    if (currentLang === lang) return;
    currentLang = lang;
    
    // 用户手动点击后，把选择存在浏览器里，以后都优先听用户的
    localStorage.setItem('siteLang', lang);
    
    // 手动切换时，先隐藏文字制造淡出动画
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => el.style.opacity = 0);

    if (!translations[lang]) {
        loadLanguage(lang).then(() => updateDOM(lang, false)); 
    } else {
        setTimeout(() => updateDOM(lang, false), 150);
    }
}

// 辅助函数：解析 json 键值
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// 更新页面文本
function updateDOM(lang, isInitialLoad = false) {
    const elements = document.querySelectorAll('[data-i18n]');
    const data = translations[lang];

    if (!data) return;

    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translatedText = getNestedValue(data, key);
        
        if (translatedText) {
            el.innerHTML = translatedText;
            
            if (isInitialLoad) {
                // 首屏加载直接显示，不磨蹭
                el.style.opacity = 1;
            } else {
                // 手动切换时保留平滑过渡
                el.style.transition = 'opacity 0.15s ease';
                el.style.opacity = 1; 
            }
        }
    });
}

// 页面加载初始化
document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 核心黑科技：IP 定位及智能语言分配
    // ==========================================
    if (!currentLang) {
        try {
            // 请求免费开源的 GeoJS 接口获取国家代码
            const response = await fetch('https://get.geojs.io/v1/ip/country.json');
            const data = await response.json();
            
            // 如果国家是 中国大陆(CN), 台湾(TW), 香港(HK), 澳门(MO)
            const zhCountries = ['CN', 'TW', 'HK', 'MO'];
            if (zhCountries.includes(data.country)) {
                currentLang = 'zh'; // 中国IP -> 中文
            } else {
                currentLang = 'en'; // 其他国家IP -> 英文
            }
        } catch (error) {
            console.warn('IP定位接口被拦截，启用浏览器语言检测作为备用方案');
            // 如果接口挂了，检测用户浏览器的默认语言是否包含 'zh' (中文)
            currentLang = navigator.language.toLowerCase().includes('zh') ? 'zh' : 'en';
        }
        
        // 把自动检测到的结果存起来
        localStorage.setItem('siteLang', currentLang);
    }

    // 正式加载语言
    loadLanguage(currentLang);


    // ==========================================
    // 下面是原有的导航栏、菜单交互逻辑
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('href');
        
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });

    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');

    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            langDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
                langDropdown.classList.remove('show');
            }
        });

        const langOption = langDropdown.querySelectorAll('.lang-option');
        langOption.forEach(btn => {
            btn.addEventListener('click', () => {
                langDropdown.classList.remove('show');
            });
        });
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navContainer = document.getElementById('nav-links');

    if (mobileMenuBtn && navContainer) {
        mobileMenuBtn.addEventListener('click', function() {
            
            navContainer.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                
                navContainer.classList.remove('active');
            });
        });
    }
});