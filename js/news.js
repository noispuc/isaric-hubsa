(function() {
    'use strict';

    console.log('📰 news.js carregado');

    // ============================================
    // 1. ESTADO
    // ============================================
    let allNews = [];
    let filteredNews = [];
    let activeCategory = 'All';

    // ============================================
    // 2. CARREGAR NOTÍCIAS
    // ============================================
    async function loadNews() {
        try {
            const NS = window.NewsShared;
            if (!NS) {
                console.error('❌ news-shared.js não foi carregado');
                return;
            }

            // O basePath é relativo à página em pages/
            allNews = await NS.loadNewsData('../');
            
            // Resolver caminhos de imagem para contexto de pages/
            allNews = allNews.map(n => ({
                ...n,
                image: NS.resolveImagePath(n.image, '../')
            }));
            
            filteredNews = [...allNews];
            
            console.log(`✅ ${allNews.length} notícias carregadas`);
            
            renderFilters();
            renderCategories();
            renderNews();

        } catch (error) {
            console.error('Erro ao carregar notícias:', error);
        }
    }

    // ============================================
    // 3. RENDERIZAR FILTROS
    // ============================================
    function renderFilters() {
        const NS = window.NewsShared;
        const container = document.getElementById('filter-pills');
        if (!container) return;

        const categories = ['All', ...new Set(allNews.map(n => n.category))];
        const allText = NS.getText('filter-all') || 'All';

        container.innerHTML = categories.map(cat => {
            const label = cat === 'All' ? allText : NS.getText(`filter-${cat.toLowerCase()}`) || cat;
            const isActive = cat === activeCategory;
            const color = cat === 'All' ? '#BA0225' : (NS.CATEGORY_COLORS[cat] || '#4A4A4A');
            return `
                <button class="filter-pill ${isActive ? 'active' : ''}" 
                        data-category="${cat}"
                        style="${isActive ? `background: ${color}; border-color: ${color}; color: #fff;` : ''}">
                    ${label}
                </button>
            `;
        }).join('');

        container.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', function() {
                activeCategory = this.dataset.category;
                renderFilters();
                filterNews();
            });
        });
    }

    // ============================================
    // 4. RENDERIZAR CATEGORIAS (sidebar)
    // ============================================
    function renderCategories() {
        const NS = window.NewsShared;
        const container = document.getElementById('categories-list');
        if (!container) return;

        const categories = [...new Set(allNews.map(n => n.category))];

        const counts = {};
        allNews.forEach(n => {
            counts[n.category] = (counts[n.category] || 0) + 1;
        });

        container.innerHTML = categories.map(cat => {
            const label = NS.getText(`filter-${cat.toLowerCase()}`) || cat;
            const isActive = cat === activeCategory;
            const color = NS.CATEGORY_COLORS[cat] || '#4A4A4A';
            const count = counts[cat] || 0;
            return `
                <button class="category-item ${isActive ? 'active' : ''}" 
                        data-category="${cat}"
                        style="${isActive ? `border-left-color: ${color}; color: ${color};` : ''}">
                    <span>${label}</span>
                    <span class="category-count">${count}</span>
                </button>
            `;
        }).join('');

        container.querySelectorAll('.category-item').forEach(btn => {
            btn.addEventListener('click', function() {
                activeCategory = this.dataset.category;
                renderCategories();
                renderFilters();
                filterNews();
            });
        });
    }

    // ============================================
    // 5. FILTRAR NOTÍCIAS
    // ============================================
    function filterNews() {
        if (activeCategory === 'All') {
            filteredNews = [...allNews];
        } else {
            filteredNews = allNews.filter(n => n.category === activeCategory);
        }
        renderNews();
    }

    // ============================================
    // 6. RENDERIZAR NOTÍCIAS
    // ============================================
    function renderNews() {
        const NS = window.NewsShared;
        const featuredContainer = document.getElementById('featured-article');
        const listContainer = document.getElementById('article-list');

        const featuredText = NS.getText('featured') || 'Featured';
        const readFullStory = NS.getText('read-full-story') || 'Read full story →';
        const readMore = NS.getText('read-more') || 'Read more →';

        // Featured article
        const featured = filteredNews.find(n => n.featured);
        if (featured && featuredContainer) {
            const color = NS.CATEGORY_COLORS[featured.category] || '#4A4A4A';
            featuredContainer.innerHTML = `
                <article class="featured-card">
                    <div class="featured-image">
                        <img src="${featured.image}" alt="${featured.imageAlt}" loading="lazy" 
                             onerror="this.src='../assets/news/default.png'">
                        <span class="featured-category" style="background: ${color};">${NS.getText(`filter-${featured.category.toLowerCase()}`) || featured.category}</span>
                        <span class="featured-badge">${featuredText}</span>
                    </div>
                    <div class="featured-content">
                        <div class="featured-meta">
                            <span>${featured.date}</span>
                            <span>·</span>
                            <span>${featured.readTime}</span>
                        </div>
                        <h2>${featured.title}</h2>
                        <p>${featured.excerpt}</p>
                        <a href="#" class="read-full" data-filename="${featured.filename}">${readFullStory}</a>
                    </div>
                </article>
            `;
        } else if (featuredContainer) {
            featuredContainer.innerHTML = '';
        }

        // Article list
        const rest = filteredNews.filter(n => !n.featured);
        if (listContainer) {
            if (rest.length === 0 && !featured) {
                listContainer.innerHTML = `<p class="no-news">${NS.getText('no-news') || 'Nenhuma notícia encontrada.'}</p>`;
                return;
            }

            listContainer.innerHTML = rest.map(n => {
                const color = NS.CATEGORY_COLORS[n.category] || '#4A4A4A';
                return `
                    <article class="article-item">
                        <div class="article-image">
                            <img src="${n.image}" alt="${n.imageAlt}" loading="lazy"
                                 onerror="this.src='../assets/news/default.png'">
                        </div>
                        <div class="article-content">
                            <span class="article-category" style="background: ${color};">${NS.getText(`filter-${n.category.toLowerCase()}`) || n.category}</span>
                            <h3>${n.title}</h3>
                            <p>${n.excerpt}</p>
                            <div class="article-meta">
                                <span>${n.date}</span>
                                <span>·</span>
                                <span>${n.readTime}</span>
                            </div>
                            <a href="#" class="read-more" data-filename="${n.filename}">${readMore}</a>
                        </div>
                    </article>
                `;
            }).join('');
        }

        // Event listeners para os links
        document.querySelectorAll('.read-full, .read-more').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const filename = this.dataset.filename;
                if (filename) {
                    openNewsModal(filename);
                }
            });
        });
    }

    // ============================================
    // 7. MODAL — ABRIR NOTÍCIA COMPLETA
    // ============================================
    function openNewsModal(filename) {
        const NS = window.NewsShared;
        const modal = document.getElementById('news-modal');
        const body = document.getElementById('news-modal-body');
        
        if (!modal || !body) return;

        body.innerHTML = `<p style="text-align: center; padding: 40px 0; color: #4A4A4A;">Carregando...</p>`;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const url = `../content/newspages/${filename}`;
        console.log('📂 Buscando:', url);

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Notícia não encontrada');
                return response.text();
            })
            .then(content => {
                const lang = localStorage.getItem('preferred_lang') || 'pt';
                
                const contentLines = NS.extractContentByLang(content, lang);
                const { title, contentHtml } = NS.renderMarkdownToHtml(contentLines);
                
                const newsItem = allNews.find(n => n.filename === filename);
                
                body.innerHTML = `
                    <h1>${title || newsItem?.title || 'Notícia'}</h1>
                    <div class="modal-meta">
                        <span class="modal-category">${newsItem?.category || ''}</span>
                        <span>${newsItem?.date || ''}</span>
                        <span>${newsItem?.readTime || ''}</span>
                        ${newsItem?.doi ? `<span>DOI: <a href="https://doi.org/${newsItem.doi}" target="_blank" rel="noopener noreferrer" style="color: #BA0225; text-decoration: underline;">${newsItem.doi}</a></span>` : ''}
                    </div>
                    <div class="modal-content">
                        ${contentHtml}
                    </div>
                `;
            })
            .catch(error => {
                console.error('Erro ao carregar notícia:', error);
                body.innerHTML = `<p style="color: #BA0225; text-align: center; padding: 40px 0;">Erro ao carregar a notícia. Tente novamente.</p>`;
            });
    }

    // ============================================
    // 8. FECHAR MODAL
    // ============================================
    function closeNewsModal() {
        const modal = document.getElementById('news-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // 9. INICIALIZAR MODAL
    // ============================================
    function initModal() {
        const overlay = document.getElementById('news-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeNewsModal);
        }
        
        const closeBtn = document.getElementById('news-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeNewsModal);
        }
        
        const backBtn = document.getElementById('news-modal-back');
        if (backBtn) {
            backBtn.addEventListener('click', closeNewsModal);
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeNewsModal();
            }
        });
    }

    // ============================================
    // 10. NEWSLETTER
    // ============================================
    function initNewsletter() {
        const form = document.getElementById('newsletter-form');
        const success = document.getElementById('newsletter-success');
        const emailInput = document.getElementById('newsletter-email');

        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                if (emailInput && emailInput.value.trim()) {
                    form.style.display = 'none';
                    if (success) success.style.display = 'block';
                }
            });
        }
    }

    // ============================================
    // 11. INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log('📰 Inicializando news...');

        function checkAndInit() {
            const testEl = document.getElementById('hero-title');
            if (testEl && testEl.textContent && testEl.textContent.trim() !== '') {
                console.log('✅ Conteúdo carregado, inicializando...');
                loadNews();
                initNewsletter();
                initModal();
            } else {
                console.log('⏳ Aguardando content-loader...');
                setTimeout(checkAndInit, 200);
            }
        }
        setTimeout(checkAndInit, 300);
    }

    // ============================================
    // 12. MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (originalSwitch) originalSwitch(lang);
        setTimeout(() => {
            loadNews();
        }, 500);
    };

    // ============================================
    // 13. EXPOR FUNÇÕES
    // ============================================
    window.loadNews = loadNews;
    window.openNewsModal = openNewsModal;
    window.closeNewsModal = closeNewsModal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();