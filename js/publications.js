(function() {
    'use strict';

    console.log('📄 publications.js carregado');

    // ============================================
    // 1. CORES POR DOENÇA
    // ============================================
    const DISEASE_COLORS = {
        'Dengue': '#BA0225',
        'Zika': '#1A6B6B',
        'Chikungunya': '#D1964F',
        'Yellow Fever': '#059669',
        'Multi-pathogen': '#7C3AED'
    };

    // ============================================
    // 2. ESTADO
    // ============================================
    let allPublications = [];
    let filteredPublications = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 8;

    let filters = {
        type: 'All',
        disease: 'All',
        year: 'All',
        search: ''
    };

    // ============================================
    // 3. FUNÇÃO PARA PEGAR TEXTO DO DOM
    // ============================================
    function getText(id) {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
    }

    // ============================================
    // 4. BUSCAR METADADOS VIA CROSSREF (COM FALLBACK)
    // ============================================
    async function fetchMetadata(doi, fallbackData) {
        try {
            const url = `https://api.crossref.org/works/${doi}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const work = data.message;

            return {
                title: work.title ? work.title[0] : fallbackData.title || 'Título não disponível',
                authors: work.author ? work.author.map(a => `${a.given} ${a.family}`).join(', ') : fallbackData.authors || 'Autores não disponíveis',
                published: work['issued'] ? work['issued']['date-parts'][0].join('-') : fallbackData.year ? `${fallbackData.year}-01-01` : 'Data não disponível',
                journal: work['container-title'] ? work['container-title'][0] : fallbackData.journal || 'Periódico não disponível',
                doi: work.DOI || doi,
                url: `https://doi.org/${doi}`
            };
        } catch (error) {
            console.warn(`⚠️ Erro ao buscar DOI ${doi}, usando fallback:`, error.message);
            
            // Fallback: usa os dados que já temos do JSON
            return {
                title: fallbackData.title || `Publicação ${doi}`,
                authors: fallbackData.authors || 'Autores não disponíveis',
                published: fallbackData.year ? `${fallbackData.year}-01-01` : 'Data não disponível',
                journal: fallbackData.journal || 'Periódico não disponível',
                doi: doi,
                url: `https://doi.org/${doi}`
            };
        }
    }

    // ============================================
    // 5. CARREGAR PUBLICAÇÕES DO JSON
    // ============================================
    async function loadPublications() {
        const lang = localStorage.getItem('preferred_lang') || 'en';
        
        try {
            const response = await fetch('../content/publications.json');
            const data = await response.json();
            const langData = data[lang] || data.en;
            
            if (!langData || !langData['publications-list']) {
                console.error('Lista de publicações não encontrada no JSON');
                return;
            }

            const pubList = langData['publications-list'];
            const publications = [];

            for (const item of pubList) {
                // Dados de fallback vindos do próprio JSON
                const fallback = {
                    title: item.title || `Publicação ${item.doi}`,
                    authors: item.authors || 'Autores não disponíveis',
                    journal: item.journal || 'Periódico não disponível',
                    year: item.year || '2024'
                };

                const metadata = await fetchMetadata(item.doi, fallback);
                
                publications.push({
                    ...metadata,
                    disease: item.disease || 'Multi-pathogen',
                    type: item.type || 'Original Research',
                    open: item.open || false,
                    highlight: item.highlight || false,
                    impact: item.impact || 0,
                    citations: item.citations || 0
                });
            }

            allPublications = publications;
            filteredPublications = [...publications];
            
            updateStats();
            generateFilters();
            renderPublications();
            renderPagination();
            
        } catch (error) {
            console.error('Erro ao carregar publicações:', error);
        }
    }

    // ============================================
    // 6. ATUALIZAR STATS
    // ============================================
    function updateStats() {
        const total = allPublications.length;
        const totalCitations = allPublications.reduce((sum, p) => sum + (p.citations || 0), 0);
        const uniqueJournals = new Set(allPublications.map(p => p.journal)).size;
        const openAccessCount = allPublications.filter(p => p.open).length;
        const openAccessPercent = total > 0 ? Math.round((openAccessCount / total) * 100) : 0;

        const pubEl = document.getElementById('stats-publications');
        const citEl = document.getElementById('stats-citations');
        const jourEl = document.getElementById('stats-journals');
        const openEl = document.getElementById('stats-openaccess');
        
        if (pubEl) pubEl.textContent = total;
        if (citEl) citEl.textContent = totalCitations.toLocaleString();
        if (jourEl) jourEl.textContent = uniqueJournals;
        if (openEl) openEl.textContent = `${openAccessPercent}%`;
        
        console.log(`📊 Stats: ${total} publicações, ${totalCitations} citações, ${uniqueJournals} periódicos, ${openAccessPercent}% open access`);
    }

    // ============================================
    // 7. GERAR FILTROS DINAMICAMENTE
    // ============================================
    function generateFilters() {
        if (allPublications.length === 0) return;
        
        const types = ['All', ...new Set(allPublications.map(p => p.type))];
        const diseases = ['All', ...new Set(allPublications.map(p => p.disease))];
        const years = ['All', ...new Set(allPublications.map(p => p.published ? p.published.split('-')[0] : '').filter(y => y))].sort((a, b) => b - a);

        const allText = getText('filter-all') || 'All';

        // Type
        const typeContainer = document.getElementById('filter-type-buttons');
        if (typeContainer) {
            typeContainer.innerHTML = types.map(type => {
                const label = type === 'All' ? allText : type;
                const isActive = filters.type === type;
                return `<button class="filter-btn ${isActive ? 'active' : ''}" data-value="${type}">${label}</button>`;
            }).join('');
            
            typeContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    filters.type = this.dataset.value;
                    updateFilterUI();
                    filterPublications();
                });
            });
        }

        // Disease
        const diseaseContainer = document.getElementById('filter-disease-buttons');
        if (diseaseContainer) {
            diseaseContainer.innerHTML = diseases.map(disease => {
                const label = disease === 'All' ? allText : disease;
                const isActive = filters.disease === disease;
                const color = DISEASE_COLORS[disease] || '#4A4A4A';
                const style = isActive ? `background: ${color}; border-color: ${color}; color: #fff;` : '';
                return `<button class="filter-btn ${isActive ? 'active' : ''}" data-value="${disease}" style="${style}">${label}</button>`;
            }).join('');
            
            diseaseContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    filters.disease = this.dataset.value;
                    updateFilterUI();
                    filterPublications();
                });
            });
        }

        // Year
        const yearContainer = document.getElementById('filter-year-buttons');
        if (yearContainer) {
            yearContainer.innerHTML = years.map(year => {
                const label = year === 'All' ? allText : year;
                const isActive = filters.year === year;
                return `<button class="filter-btn ${isActive ? 'active' : ''}" data-value="${year}">${label}</button>`;
            }).join('');
            
            yearContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    filters.year = this.dataset.value;
                    updateFilterUI();
                    filterPublications();
                });
            });
        }
    }

    // ============================================
    // 8. ATUALIZAR UI DOS FILTROS
    // ============================================
    function updateFilterUI() {
        // Type
        document.querySelectorAll('#filter-type-buttons .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === filters.type);
            if (btn.dataset.value === filters.type) {
                btn.style.background = '#BA0225';
                btn.style.borderColor = '#BA0225';
                btn.style.color = '#fff';
            } else {
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }
        });

        // Disease
        document.querySelectorAll('#filter-disease-buttons .filter-btn').forEach(btn => {
            const isActive = btn.dataset.value === filters.disease;
            btn.classList.toggle('active', isActive);
            if (isActive) {
                const color = DISEASE_COLORS[btn.dataset.value] || '#BA0225';
                btn.style.background = color;
                btn.style.borderColor = color;
                btn.style.color = '#fff';
            } else {
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }
        });

        // Year
        document.querySelectorAll('#filter-year-buttons .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === filters.year);
            if (btn.dataset.value === filters.year) {
                btn.style.background = '#1A6B6B';
                btn.style.borderColor = '#1A6B6B';
                btn.style.color = '#fff';
            } else {
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }
        });
    }

    // ============================================
    // 9. FILTRAR PUBLICAÇÕES
    // ============================================
    function filterPublications() {
        const searchTerm = filters.search.toLowerCase().trim();

        filteredPublications = allPublications.filter(pub => {
            const matchType = filters.type === 'All' || pub.type === filters.type;
            const matchDisease = filters.disease === 'All' || pub.disease === filters.disease;
            const matchYear = filters.year === 'All' || (pub.published && pub.published.split('-')[0] === filters.year);
            
            const matchSearch = searchTerm === '' || 
                (pub.title && pub.title.toLowerCase().includes(searchTerm)) ||
                (pub.authors && pub.authors.toLowerCase().includes(searchTerm)) ||
                (pub.journal && pub.journal.toLowerCase().includes(searchTerm)) ||
                (pub.doi && pub.doi.toLowerCase().includes(searchTerm));

            return matchType && matchDisease && matchYear && matchSearch;
        });

        currentPage = 1;
        renderPublications();
        renderPagination();
    }

    // ============================================
    // 10. RENDERIZAR PUBLICAÇÕES
    // ============================================
    function renderPublications() {
        const list = document.getElementById('publications-list');
        const noResults = document.getElementById('no-results');
        const countEl = document.getElementById('results-count');

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = filteredPublications.slice(start, end);

        const showingText = getText('showing') || 'Showing';
        const ofText = getText('of') || 'of';
        const pubsText = getText('publications') || 'publications';
        countEl.textContent = `${showingText} ${filteredPublications.length} ${ofText} ${allPublications.length} ${pubsText}`;

        if (pageItems.length === 0) {
            list.innerHTML = '';
            noResults.style.display = 'block';
            const pagination = document.getElementById('pagination-wrapper');
            if (pagination) pagination.style.display = 'none';
            return;
        }
        noResults.style.display = 'none';
        const pagination = document.getElementById('pagination-wrapper');
        if (pagination) pagination.style.display = 'flex';

        const featuredText = getText('featured') || 'Featured';
        const openAccessText = getText('open-access') || 'Open Access';
        const viewText = getText('view') || 'View';
        const citeText = getText('cite') || 'Cite';
        const citationsText = getText('citations') || 'citations';

        list.innerHTML = pageItems.map(pub => {
            const color = DISEASE_COLORS[pub.disease] || '#4A4A4A';
            return `
                <article class="publication-card ${pub.highlight ? 'featured' : ''}">
                    <div class="pub-tags">
                        ${pub.highlight ? `<span class="tag-featured">⭐ ${featuredText}</span>` : ''}
                        <span class="tag-disease" style="background: ${color}15; color: ${color};">${pub.disease || 'N/A'}</span>
                        <span class="tag-type">${pub.type || 'N/A'}</span>
                        ${pub.open ? `<span class="tag-openaccess">${openAccessText}</span>` : ''}
                    </div>

                    <h3 class="pub-title">${pub.title || 'Título não disponível'}</h3>
                    <p class="pub-authors">${pub.authors || 'Autores não disponíveis'}</p>

                    <div class="pub-meta">
                        <div class="pub-info">
                            <span class="pub-journal">${pub.journal || 'Periódico não disponível'}</span>
                            <span class="pub-year">${pub.published ? pub.published.split('-')[0] : ''}</span>
                            ${pub.impact ? `<span class="pub-impact">IF: ${pub.impact}</span>` : ''}
                            <span class="pub-citations">${pub.citations || 0} ${citationsText}</span>
                        </div>
                        <div class="pub-actions">
                            <a href="${pub.url || `https://doi.org/${pub.doi}`}" target="_blank" rel="noopener noreferrer" class="btn-view">
                                ${viewText}
                            </a>
                            <button class="btn-cite" data-doi="${pub.doi}" data-title="${pub.title}" data-authors="${pub.authors}" data-journal="${pub.journal}" data-year="${pub.published ? pub.published.split('-')[0] : ''}">
                                ${citeText}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        document.querySelectorAll('.btn-cite').forEach(btn => {
            btn.addEventListener('click', function() {
                const doi = this.dataset.doi;
                const title = this.dataset.title;
                const authors = this.dataset.authors;
                const journal = this.dataset.journal;
                const year = this.dataset.year;
                const citation = `${authors} (${year}). ${title}. ${journal}. https://doi.org/${doi}`;

                navigator.clipboard.writeText(citation).then(() => {
                    const originalText = this.textContent;
                    this.textContent = '✓ Copied!';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 2000);
                }).catch(() => {
                    prompt('Copy citation:', citation);
                });
            });
        });
    }

    // ============================================
    // 11. RENDERIZAR PAGINAÇÃO
    // ============================================
    function renderPagination() {
        const totalPages = Math.ceil(filteredPublications.length / ITEMS_PER_PAGE);
        const numbersContainer = document.getElementById('pagination-numbers');
        const prevBtn = document.getElementById('pagination-prev');
        const nextBtn = document.getElementById('pagination-next');

        if (!numbersContainer || !prevBtn || !nextBtn) return;

        if (totalPages <= 1) {
            numbersContainer.innerHTML = '';
            prevBtn.style.visibility = 'hidden';
            nextBtn.style.visibility = 'hidden';
            return;
        }

        prevBtn.style.visibility = 'visible';
        nextBtn.style.visibility = 'visible';
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;

        let html = '';
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="pagination-num" data-page="1">1</button>`;
            if (startPage > 2) html += `<span class="pagination-dots">…</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="pagination-dots">…</span>`;
            html += `<button class="pagination-num" data-page="${totalPages}">${totalPages}</button>`;
        }

        numbersContainer.innerHTML = html;

        numbersContainer.querySelectorAll('.pagination-num').forEach(btn => {
            btn.addEventListener('click', function() {
                currentPage = parseInt(this.dataset.page);
                renderPublications();
                renderPagination();
                const list = document.getElementById('publications-list');
                if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    // ============================================
    // 12. INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log('📄 Inicializando publications...');

        // Barra de pesquisa
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');

        function performSearch() {
            filters.search = searchInput ? searchInput.value : '';
            filterPublications();
        }

        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') performSearch();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }

        // Limpar filtros
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                filters = { type: 'All', disease: 'All', year: 'All', search: '' };
                const searchInputEl = document.getElementById('search-input');
                if (searchInputEl) searchInputEl.value = '';
                updateFilterUI();
                filterPublications();
            });
        }

        // Paginação
        const prevBtn = document.getElementById('pagination-prev');
        const nextBtn = document.getElementById('pagination-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    renderPublications();
                    renderPagination();
                    const list = document.getElementById('publications-list');
                    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                const totalPages = Math.ceil(filteredPublications.length / ITEMS_PER_PAGE);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPublications();
                    renderPagination();
                    const list = document.getElementById('publications-list');
                    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        // Aguarda content-loader e carrega os dados
        function checkAndInit() {
            const testEl = document.getElementById('hero-title');
            if (testEl && testEl.textContent && testEl.textContent.trim() !== '') {
                console.log('✅ Conteúdo carregado, inicializando...');
                loadPublications();
            } else {
                console.log('⏳ Aguardando content-loader...');
                setTimeout(checkAndInit, 200);
            }
        }
        setTimeout(checkAndInit, 300);
    }

    // ============================================
    // 13. MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (originalSwitch) originalSwitch(lang);
        setTimeout(() => {
            loadPublications();
        }, 500);
    };

    // ============================================
    // 14. EXPOR FUNÇÕES
    // ============================================
    window.loadPublications = loadPublications;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();