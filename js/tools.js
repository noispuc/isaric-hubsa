(function() {
    'use strict';

    console.log('🔧 tools.js carregado');

    const TOOLS = [
        { id: 'arc', color: '#1A6B6B', icon: '📚', category: 'Data' },
        { id: 'bridge', color: '#D1964F', icon: '🌉', category: 'Data' },
        { id: 'vertex', color: '#BA0225', icon: '📊', category: 'Analytics' },
        { id: 'rapid', color: '#7C3AED', icon: '⚡', category: 'Analytics' }
    ];

    let currentTool = 'arc';
    let currentFilter = 'All';

    // ============================================
    // FUNÇÃO PARA PEGAR TEXTO DO DOM
    // ============================================
    function getText(id) {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
    }

    // ============================================
    // MOSTRA/ESCONDE DETALHES
    // ============================================
    function showTool(toolId) {
        // Esconde todos
        TOOLS.forEach(t => {
            const detail = document.getElementById(`detail-${t.id}`);
            if (detail) detail.style.display = 'none';
        });

        // Mostra o selecionado
        const selected = document.getElementById(`detail-${toolId}`);
        if (selected) selected.style.display = 'block';

        // Atualiza cards
        document.querySelectorAll('.tool-card').forEach(card => {
            const id = card.dataset.tool;
            const tool = TOOLS.find(t => t.id === id);
            if (!tool) return;
            
            const isActive = id === toolId;
            card.classList.toggle('active', isActive);
            card.style.borderColor = isActive ? tool.color : 'transparent';
            
            const iconEl = card.querySelector('.tool-icon');
            if (iconEl) {
                iconEl.style.color = isActive ? tool.color : '';
            }
        });

        // Atualiza ícone principal
        const tool = TOOLS.find(t => t.id === toolId);
        if (tool) {
            const iconEl = document.getElementById('tool-detail-icon');
            if (iconEl) {
                iconEl.textContent = tool.icon;
                iconEl.style.color = tool.color;
            }
        }

        currentTool = toolId;
    }

    // ============================================
    // FILTRA CARDS USANDO data-category
    // ============================================
    function filterTools() {
        console.log(`🔍 Filtrando por: ${currentFilter}`);
        
        document.querySelectorAll('.tool-card').forEach(card => {
            // USA O ATRIBUTO data-category DO HTML
            const category = card.dataset.category;
            
            let show = false;
            if (currentFilter === 'All') {
                show = true;
            } else {
                // Compara o valor do atributo com o filtro
                show = category === currentFilter;
            }
            
            card.style.display = show ? 'flex' : 'none';
            console.log(`   Card ${card.dataset.tool}: categoria="${category}", filtro="${currentFilter}", show=${show}`);
        });
        
        // Se o tool atual está escondido, mostra o primeiro disponível
        const currentCard = document.querySelector(`.tool-card[data-tool="${currentTool}"]`);
        if (currentCard && currentCard.style.display === 'none') {
            const firstVisible = document.querySelector('.tool-card[style*="display: flex"]');
            if (firstVisible) {
                const newTool = firstVisible.dataset.tool;
                if (newTool) {
                    currentTool = newTool;
                    showTool(currentTool);
                }
            }
        }
    }

    // ============================================
    // ATUALIZA SUBMENU
    // ============================================
    function updateSubmenu() {
        const wrapper = document.getElementById('submenu-wrapper');
        if (!wrapper) return;

        const allLabel = getText('submenu-all') || 'All';
        const dataLabel = getText('submenu-data') || 'Data';
        const analyticsLabel = getText('submenu-analytics') || 'Analytics';

        // Mapeia os IDs do filtro para os textos exibidos
        const categories = [
            { id: 'All', label: allLabel, color: '#BA0225' },
            { id: 'Data', label: dataLabel, color: '#1A6B6B' },
            { id: 'Analytics', label: analyticsLabel, color: '#7C3AED' }
        ];

        wrapper.innerHTML = categories.map(cat => {
            const isActive = cat.id === currentFilter;
            return `
                <button class="submenu-btn ${isActive ? 'active' : ''}" 
                        data-category="${cat.id}"
                        style="${isActive ? `background: ${cat.color}; border-color: ${cat.color}; color: #fff;` : ''}">
                    ${cat.id !== 'All' ? `<span class="dot-indicator" style="background: ${cat.color};"></span>` : ''}
                    ${cat.label}
                </button>
            `;
        }).join('');

        // Event listeners
        wrapper.querySelectorAll('.submenu-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                currentFilter = this.dataset.category;
                updateSubmenu();
                filterTools();
            });
        });
    }

    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log('🔧 Inicializando tools...');

        // Click nos cards
        document.addEventListener('click', function(e) {
            const card = e.target.closest('.tool-card');
            if (card) {
                const toolId = card.dataset.tool;
                if (toolId && toolId !== currentTool) {
                    currentTool = toolId;
                    showTool(toolId);
                }
            }
        });

        // Aguarda content-loader
        function checkAndInit() {
            const testEl = document.getElementById('tool-arc-name');
            if (testEl && testEl.textContent && testEl.textContent.trim() !== '') {
                console.log('✅ Conteúdo carregado, inicializando...');
                updateSubmenu();
                filterTools();
                showTool('arc');
            } else {
                console.log('⏳ Aguardando content-loader...');
                setTimeout(checkAndInit, 200);
            }
        }
        setTimeout(checkAndInit, 300);
    }

    // ============================================
    // MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (originalSwitch) originalSwitch(lang);
        setTimeout(() => {
            updateSubmenu();
            filterTools();
            showTool(currentTool);
        }, 500);
    };

    // ============================================
    // EXPOR FUNÇÕES
    // ============================================
    window.showTool = showTool;
    window.filterTools = filterTools;
    window.updateSubmenu = updateSubmenu;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();