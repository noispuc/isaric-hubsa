(function() {
    'use strict';

    console.log('📊 dashboard.js carregado');

    // ============================================
    // 1. FUNÇÃO PARA PEGAR TEXTO DO DOM
    // ============================================
    function getText(id) {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
    }

    // ============================================
    // 2. CARREGAR DASHBOARDS DO JSON
    // ============================================
    async function loadDashboards() {
        try {
            const lang = localStorage.getItem('preferred_lang') || 'pt';
            
            const response = await fetch('../content/dashboard.json');
            if (!response.ok) {
                console.warn('Não foi possível carregar o arquivo dashboard.json');
                return;
            }
            const data = await response.json();
            const langData = data[lang] || data.pt;

            if (!langData || !langData.dashboards) {
                console.warn('Lista de dashboards não encontrada');
                return;
            }

            const dashboards = langData.dashboards;
            renderDashboards(dashboards);

        } catch (error) {
            console.error('Erro ao carregar dashboards:', error);
        }
    }

    // ============================================
    // 3. RENDERIZAR DASHBOARDS
    // ============================================
    function renderDashboards(dashboards) {
        const container = document.getElementById('dashboard-grid');
        if (!container) return;

        if (!dashboards || dashboards.length === 0) {
            container.innerHTML = `<p class="no-results">${getText('no-dashboards') || 'Nenhum dashboard disponível.'}</p>`;
            return;
        }

        const openFullText = getText('open-full-dashboard') || 'Open Full Dashboard';

        container.innerHTML = dashboards.map(dashboard => {
            const color = dashboard.color || '#BA0225';
            
            return `
                <div class="dashboard-card" style="--card-color: ${color};">
                    <div class="dashboard-card-header" style="background: ${color};">
                        <h3 class="dashboard-name">${dashboard.name}</h3>
                        <span class="dashboard-status live">● ${getText('live') || 'Ao vivo'}</span>
                    </div>
                    <div class="dashboard-iframe-wrapper">
                        <iframe 
                            src="${dashboard.url}" 
                            title="${dashboard.name}"
                            loading="lazy"
                            allow="fullscreen"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            frameborder="0">
                        </iframe>
                    </div>
                    <div class="dashboard-card-footer">
                        <p class="dashboard-description">${dashboard.description || 'Em breve'}</p>
                        <a href="${dashboard.url}" target="_blank" rel="noopener noreferrer" class="dashboard-link" style="color: ${color};">
                            ${openFullText} →
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // 4. INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log('📊 Inicializando dashboard...');

        function checkAndInit() {
            const testEl = document.getElementById('hero-title');
            if (testEl && testEl.textContent && testEl.textContent.trim() !== '') {
                console.log('✅ Conteúdo carregado, inicializando dashboard...');
                loadDashboards();
            } else {
                console.log('⏳ Aguardando content-loader...');
                setTimeout(checkAndInit, 200);
            }
        }
        setTimeout(checkAndInit, 300);
    }

    // ============================================
    // 5. MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (originalSwitch) originalSwitch(lang);
        setTimeout(() => {
            loadDashboards();
        }, 500);
    };

    // ============================================
    // 6. EXPOR FUNÇÕES
    // ============================================
    window.loadDashboards = loadDashboards;

    // Iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();