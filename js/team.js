(function() {
    'use strict';

    console.log('👥 team.js carregado');

    // ============================================
    // 1. CORES POR GRUPO
    // ============================================
    const GROUP_COLORS = {
        'Leadership': '#BA0225',
        'Clinical': '#1A6B6B',
        'Data & Analytics': '#7C3AED',
        'Training': '#D1964F'
    };

    // ============================================
    // 2. ESTADO
    // ============================================
    let allMembers = [];
    let filteredMembers = [];
    let activeFilter = 'All';

    // ============================================
    // 3. FUNÇÃO PARA PEGAR TEXTO DO DOM
    // ============================================
    function getText(id) {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
    }

    // ============================================
    // 4. CARREGAR MEMBROS DO JSON
    // ============================================
    async function loadTeam() {
        try {
            const lang = localStorage.getItem('preferred_lang') || 'pt';
            
            const response = await fetch('../content/team.json');
            if (!response.ok) {
                console.warn('Não foi possível carregar o arquivo team.json');
                return;
            }
            const data = await response.json();
            const langData = data[lang] || data.pt;

            if (!langData || !langData.members) {
                console.warn('Lista de membros não encontrada');
                return;
            }

            allMembers = langData.members;
            filteredMembers = [...allMembers];
            
            renderFilters();
            renderMembers();

        } catch (error) {
            console.error('Erro ao carregar equipe:', error);
        }
    }

    // ============================================
    // 5. RENDERIZAR FILTROS
    // ============================================
    function renderFilters() {
        const container = document.getElementById('filter-pills');
        if (!container) return;

        // Pega todos os grupos únicos (incluindo múltiplos)
        const allGroups = [];
        allMembers.forEach(m => {
            if (Array.isArray(m.group)) {
                m.group.forEach(g => {
                    if (!allGroups.includes(g)) allGroups.push(g);
                });
            } else {
                if (!allGroups.includes(m.group)) allGroups.push(m.group);
            }
        });
        
        const groups = ['All', ...allGroups];
        const allText = getText('filter-all') || 'All';

        container.innerHTML = groups.map(group => {
            const label = group === 'All' ? allText : getText(`filter-${group.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`) || group;
            const isActive = group === activeFilter;
            const color = group === 'All' ? '#BA0225' : (GROUP_COLORS[group] || '#4A4A4A');
            return `
                <button class="filter-pill ${isActive ? 'active' : ''}" 
                        data-group="${group}"
                        style="${isActive ? `background: ${color}; border-color: ${color}; color: #fff;` : ''}">
                    ${label}
                </button>
            `;
        }).join('');

        container.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', function() {
                activeFilter = this.dataset.group;
                renderFilters();
                filterMembers();
            });
        });
}

    // ============================================
    // 6. FILTRAR MEMBROS
    // ============================================
    function filterMembers() {
        if (activeFilter === 'All') {
            filteredMembers = [...allMembers];
        } else {
            filteredMembers = allMembers.filter(m => {
                // Se group for array, verifica se contém o filtro ativo
                if (Array.isArray(m.group)) {
                    return m.group.includes(activeFilter);
                }
                // Se group for string, compara diretamente
                return m.group === activeFilter;
            });
        }
        renderMembers();
    }

    // ============================================
    // 7. RENDERIZAR MEMBROS
    // ============================================
    function renderMembers() {
        const container = document.getElementById('team-grid');
        if (!container) return;

        if (filteredMembers.length === 0) {
            container.innerHTML = `<p class="no-results">${getText('no-results') || 'Nenhum membro encontrado.'}</p>`;
            return;
        }

        // Caminho base para imagens
        const basePath = '../assets/people/';

        container.innerHTML = filteredMembers.map(member => {
            const color = GROUP_COLORS[member.group] || '#4A4A4A';
            
            // Gerar links
            let linksHtml = '';
            if (member.links && member.links.length > 0) {
                linksHtml = member.links.map(link => {
                    const iconMap = {
                        'lattes': 'lattes.png',
                        'linkedin': 'linkedin.svg',
                        'other': 'other.svg'
                    };
                    const iconFile = iconMap[link.type] || 'other.svg';
                    const iconPath = `../assets/icons/${iconFile}`;
                    const label = link.type.charAt(0).toUpperCase() + link.type.slice(1);
                    return `<a href="${link.url}" target="_blank" rel="noopener noreferrer" aria-label="${label}"><img src="${iconPath}" alt="${label}"></a>`;
                }).join('');
            }

            return `
                <div class="team-card">
                    <img src="${basePath}${member.image}" alt="${member.name}" class="team-photo" loading="lazy" onerror="this.src='../assets/people/default.png'">
                    <h3>${member.name}</h3>
                    <p class="team-role">${member.role}</p>
                    <p class="team-bio">${member.bio}</p>
                    ${linksHtml ? `<div class="team-links">${linksHtml}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // ============================================
    // 8. INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log('👥 Inicializando team...');

        function checkAndInit() {
            const testEl = document.getElementById('hero-title');
            if (testEl && testEl.textContent && testEl.textContent.trim() !== '') {
                console.log('✅ Conteúdo carregado, inicializando team...');
                loadTeam();
            } else {
                console.log('⏳ Aguardando content-loader...');
                setTimeout(checkAndInit, 200);
            }
        }
        setTimeout(checkAndInit, 300);
    }

    // ============================================
    // 9. MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (originalSwitch) originalSwitch(lang);
        setTimeout(() => {
            loadTeam();
        }, 500);
    };

    // ============================================
    // 10. EXPOR FUNÇÕES
    // ============================================
    window.loadTeam = loadTeam;

    // Iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();