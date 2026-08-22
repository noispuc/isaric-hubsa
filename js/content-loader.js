// ============================================
// CONTENT LOADER – Carrega conteúdo dos JSONs
// ============================================
(function() {
    'use strict';

    // ============================================
    // 1. DETECÇÃO DE IDIOMA
    // ============================================
    function getUserLanguage() {
        const savedLang = localStorage.getItem('preferred_lang');
        if (savedLang && ['pt', 'en', 'es'].includes(savedLang)) {
            return savedLang;
        }

        const browserLang = navigator.language || navigator.userLanguage || 'en';
        const lang = browserLang.split('-')[0].toLowerCase();

        if (['pt', 'en', 'es'].includes(lang)) {
            return lang;
        }
        return 'en';
    }

    // ============================================
    // 2. FUNÇÃO PARA IDENTIFICAR A PÁGINA ATUAL
    // ============================================
    function getPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();

        if (!filename || filename === '' || filename === 'index.html' || filename === '/') {
            return 'index';
        }

        return filename.replace('.html', '');
    }

    // ============================================
    // 3. FUNÇÃO PARA CARREGAR CONTEÚDO
    // ============================================
    async function loadContent() {
        const lang = getUserLanguage();
        const page = getPageName();

        console.log(`🔄 Carregando: ${page}.json, idioma: ${lang}`);

        try {
            const path = window.location.pathname;
            const isInPages = path.includes('/pages/') || path.includes('/pages');
            
            let jsonPath;
            if (isInPages) {
                jsonPath = `../content/${page}.json`;
            } else {
                jsonPath = `./content/${page}.json`;
            }
            
            console.log(`📡 Buscando: ${jsonPath}`);

            let response = await fetch(jsonPath);
            
            if (!response.ok && isInPages) {
                console.log(`⚠️ Tentando caminho alternativo...`);
                jsonPath = `/content/${page}.json`;
                response = await fetch(jsonPath);
            }
            
            if (!response.ok) {
                console.warn(`❌ Arquivo ${jsonPath} não encontrado (status: ${response.status})`);
                return;
            }

            const data = await response.json();
            console.log('✅ JSON carregado:', data);

            if (!data[lang]) {
                console.warn(`Idioma "${lang}" não encontrado, usando "en" como fallback`);
                if (data.en) {
                    applyContent(data.en);
                }
            } else {
                applyContent(data[lang]);
                localStorage.setItem('preferred_lang', lang);
            }

        } catch (error) {
            console.error('❌ Erro ao carregar conteúdo:', error);
        }
    }

    // ============================================
    // 4. FUNÇÃO PARA APLICAR CONTEÚDO AO DOM (COM SUPORTE A URLs)
    // ============================================
    function applyContent(translations) {
        if (!translations) return;

        let count = 0;
        let errors = 0;
        let urlCount = 0;
        
        Object.keys(translations).forEach(key => {
            const value = translations[key];
            if (!value) return;

            try {
                // ============================================
                // VERIFICA SE É UMA URL (para preencher href)
                // ============================================
                const isUrl = value.startsWith('http://') || value.startsWith('https://');
                
                // ============================================
                // 1. BUSCA POR ID
                // ============================================
                const element = document.getElementById(key);
                if (element) {
                    // Se for URL, preenche o href
                    if (isUrl) {
                        element.setAttribute('href', value);
                        urlCount++;
                        console.log(`🔗 ${key} → ${value}`);
                    } 
                    // Se for elemento de formulário
                    else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        if (element.type === 'submit' || element.type === 'button') {
                            element.value = value;
                        } else {
                            element.placeholder = value;
                        }
                    } 
                    // Para elementos normais
                    else {
                        element.innerHTML = value;
                    }
                    count++;
                    return;
                }
                
                // ============================================
                // 2. BUSCA POR DATA-I18N
                // ============================================
                const elements = document.querySelectorAll(`[data-i18n="${key}"]`);
                if (elements.length > 0) {
                    elements.forEach(el => {
                        // Se for URL, preenche o href
                        if (isUrl) {
                            el.setAttribute('href', value);
                            urlCount++;
                            console.log(`🔗 ${key} → ${value}`);
                        } else {
                            el.innerHTML = value;
                        }
                        count++;
                    });
                    return;
                }
                
                // ============================================
                // 3. VERIFICA SE É UMA CHAVE DE FEATURE (ignora se não encontrou)
                // ============================================
                if (key.includes('feature-') || key.includes('stat-')) {
                    // Essas chaves são renderizadas dinamicamente pelo JS
                    return;
                }
                
                errors++;
                console.warn(`⚠️ Elemento não encontrado para: ${key}`);
                
            } catch (err) {
                console.warn(`Erro ao aplicar "${key}":`, err);
            }
        });
        
        console.log(`✅ ${count} elementos preenchidos (${urlCount} URLs, ${errors} não encontrados)`);
    }

    // ============================================
    // 5. FUNÇÃO PARA TROCAR IDIOMA
    // ============================================
    window.switchLanguage = function(lang) {
        if (!['pt', 'en', 'es'].includes(lang)) return;
        localStorage.setItem('preferred_lang', lang);
        loadContent();

        document.querySelectorAll('.idioma button').forEach(btn => {
            btn.classList.remove('active');
            const btnLang = btn.id ? btn.id.replace('lang-', '') : '';
            if (btnLang === lang) {
                btn.classList.add('active');
            }
        });
    };

    // ============================================
    // 6. INICIALIZAÇÃO
    // ============================================
    let isContentLoaded = false;

    window.loadContent = loadContent;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (!isContentLoaded) {
                isContentLoaded = true;
                loadContent();
            }
        });
    } else {
        if (!isContentLoaded) {
            isContentLoaded = true;
            setTimeout(loadContent, 50);
        }
    }

    // ============================================
    // 7. ATUALIZA O SELETOR DE IDIOMA
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        const lang = getUserLanguage();
        document.querySelectorAll('.idioma button').forEach(btn => {
            const btnLang = btn.id ? btn.id.replace('lang-', '') : '';
            if (btnLang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    });

})();