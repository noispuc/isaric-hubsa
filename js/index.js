(function() {
    'use strict';

    console.log('🏠 index.js carregado');

    // ============================================
    // 1. ESTADO GLOBAL
    // ============================================
    let allNews = [];
    let modalInitialized = false;

    // ============================================
    // 2. CARREGAR NOTÍCIAS NA HOME
    // ============================================
    async function loadHomeNews() {
        try {
            const NS = window.NewsShared;
            if (!NS) {
                console.error('❌ news-shared.js não foi carregado');
                return;
            }

            // O basePath é relativo à raiz do site (home)
            const newsItems = await NS.loadNewsData('./');
            
            // Resolver caminhos de imagem para contexto da home
            allNews = newsItems.map(n => ({
                ...n,
                image: NS.resolveImagePath(n.image, './')
            }));
            
            console.log(`📊 Total de notícias carregadas: ${allNews.length}`);
            
            const latestNews = allNews.slice(0, 5);
            
            if (latestNews.length > 0) {
                renderHomeNews(latestNews);
                console.log(`✅ ${latestNews.length} notícias renderizadas na home`);
            } else {
                console.warn('⚠️ Nenhuma notícia carregada');
                const section = document.getElementById('latest-news');
                if (section) section.style.display = 'none';
            }

        } catch (error) {
            console.error('❌ Erro ao carregar notícias na home:', error);
        }
    }

    // ============================================
    // 3. RENDERIZAR NOTÍCIAS NA HOME
    // ============================================
    function renderHomeNews(newsItems) {
        const NS = window.NewsShared;

        if (!newsItems || newsItems.length === 0) {
            console.warn('⚠️ Nenhuma notícia para exibir na home');
            const section = document.getElementById('latest-news');
            if (section) section.style.display = 'none';
            return;
        }

        const featured = newsItems[0];
        const thumbs = newsItems.slice(1, 5);

        // Featured news
        const featuredImg = document.getElementById('news-featured-image');
        const featuredBadge = document.getElementById('news-featured-badge');
        const featuredDate = document.getElementById('news-featured-date');
        const featuredTitle = document.getElementById('news-featured-title');
        const featuredExcerpt = document.getElementById('news-featured-excerpt');
        const featuredLink = document.getElementById('news-featured-link');

        if (featuredImg) {
            featuredImg.src = featured.image;
            featuredImg.alt = featured.imageAlt || 'Notícia em destaque';
            featuredImg.onerror = function() {
                this.src = 'assets/news/default.png';
            };
            featuredImg.style.display = 'block';
        }
        
        if (featuredBadge) {
            const categoryText = NS.getText(`filter-${featured.category.toLowerCase()}`) || featured.category;
            featuredBadge.textContent = categoryText;
            const color = NS.CATEGORY_COLORS[featured.category] || '#BA0225';
            featuredBadge.style.background = color;
            featuredBadge.style.display = 'inline-block';
        }
        
        if (featuredDate) featuredDate.textContent = featured.date;
        if (featuredTitle) featuredTitle.textContent = featured.title;
        if (featuredExcerpt) featuredExcerpt.textContent = featured.excerpt;
        
        if (featuredLink) {
            featuredLink.href = '#';
            featuredLink.dataset.filename = featured.filename;
            
            const newLink = featuredLink.cloneNode(true);
            featuredLink.parentNode.replaceChild(newLink, featuredLink);
            
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                const filename = this.dataset.filename;
                if (filename) {
                    openHomeNewsModal(filename);
                }
            });
        }

        // Thumbs configuration
        const thumbConfigs = [
            { 
                id: 1, 
                badgeId: 'news-thumb-1-badge', 
                dateId: 'news-thumb-1-date', 
                titleId: 'news-thumb-1-title', 
                linkId: 'news-thumb-1-link', 
                imgId: 'news-thumb-1-image',
                containerId: 'news-thumb-1'
            },
            { 
                id: 2, 
                badgeId: 'news-thumb-2-badge', 
                dateId: 'news-thumb-2-date', 
                titleId: 'news-thumb-2-title', 
                linkId: 'news-thumb-2-link', 
                imgId: 'news-thumb-2-image',
                containerId: 'news-thumb-2'
            },
            { 
                id: 3, 
                badgeId: 'news-thumb-3-badge', 
                dateId: 'news-thumb-3-date', 
                titleId: 'news-thumb-3-title', 
                linkId: 'news-thumb-3-link', 
                imgId: 'news-thumb-3-image',
                containerId: 'news-thumb-3'
            },
            { 
                id: 4, 
                badgeId: 'news-thumb-4-badge', 
                dateId: 'news-thumb-4-date', 
                titleId: 'news-thumb-4-title', 
                linkId: 'news-thumb-4-link', 
                imgId: 'news-thumb-4-image',
                containerId: 'news-thumb-4'
            }
        ];

        thumbs.forEach((news, index) => {
            if (index >= thumbConfigs.length) return;
            const config = thumbConfigs[index];
            
            const container = document.getElementById(config.containerId);
            const img = document.getElementById(config.imgId);
            const badge = document.getElementById(config.badgeId);
            const date = document.getElementById(config.dateId);
            const title = document.getElementById(config.titleId);
            const link = document.getElementById(config.linkId);

            if (container) {
                container.style.display = 'flex';
            }

            if (img) {
                img.src = news.image;
                img.alt = news.imageAlt || 'Notícia';
                img.onerror = function() {
                    this.src = 'assets/news/default.png';
                };
                img.style.display = 'block';
            }
            
            if (badge) {
                const categoryText = NS.getText(`filter-${news.category.toLowerCase()}`) || news.category;
                badge.textContent = categoryText;
                const color = NS.CATEGORY_COLORS[news.category] || '#4A4A4A';
                badge.style.background = color;
                badge.style.display = 'inline-block';
            }
            
            if (date) date.textContent = news.date;
            if (title) title.textContent = news.title;
            
            if (link) {
                link.href = '#';
                link.dataset.filename = news.filename;
                
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);
                
                newLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    const filename = this.dataset.filename;
                    if (filename) {
                        openHomeNewsModal(filename);
                    }
                });
            }
        });

        // Esconder thumbs não utilizados
        for (let i = thumbs.length; i < thumbConfigs.length; i++) {
            const config = thumbConfigs[i];
            const container = document.getElementById(config.containerId);
            if (container) {
                container.style.display = 'none';
            }
        }
    }

    // ============================================
    // 4. MODAL PARA A HOME
    // ============================================
    function openHomeNewsModal(filename) {
        const NS = window.NewsShared;
        const modal = document.getElementById('news-modal');
        const body = document.getElementById('news-modal-body');
        
        if (!modal || !body) {
            console.warn('⚠️ Modal não encontrado, redirecionando para página de notícias');
            window.location.href = 'pages/news.html';
            return;
        }

        body.innerHTML = `<p style="text-align: center; padding: 40px 0; color: #4A4A4A;">Carregando...</p>`;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const url = `content/newspages/${filename}`;

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
                    </div>
                    <div class="modal-content">
                        ${contentHtml}
                    </div>
                `;
            })
            .catch(error => {
                console.error('❌ Erro ao carregar notícia:', error);
                body.innerHTML = `<p style="color: #BA0225; text-align: center; padding: 40px 0;">Erro ao carregar a notícia. Tente novamente.</p>`;
            });
    }

    // ============================================
    // 5. FECHAR MODAL
    // ============================================
    function closeHomeNewsModal() {
        const modal = document.getElementById('news-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // 6. INICIALIZAR MODAL
    // ============================================
    function initHomeModal() {
        if (modalInitialized) return;
        
        const overlay = document.getElementById('news-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeHomeNewsModal);
        }
        
        const closeBtn = document.getElementById('news-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeHomeNewsModal);
        }
        
        const backBtn = document.getElementById('news-modal-back');
        if (backBtn) {
            backBtn.addEventListener('click', closeHomeNewsModal);
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeHomeNewsModal();
            }
        });
        
        modalInitialized = true;
        console.log('✅ Modal da home inicializado');
    }

    // ============================================
    // 7. INICIALIZAÇÃO DA HOME
    // ============================================
    function initHome() {
        console.log('🏠 Inicializando home...');

        initHomeModal();

        let attempts = 0;
        const maxAttempts = 30;
        
        const checkInterval = setInterval(function() {
            attempts++;
            
            const featuredLink = document.getElementById('news-featured-link');
            const heroTitle = document.getElementById('hero-title');
            
            const isContentLoaded = (heroTitle && heroTitle.textContent && heroTitle.textContent.trim() !== '') ||
                                   (featuredLink && featuredLink.textContent && featuredLink.textContent.trim() !== '');
            
            if (isContentLoaded) {
                console.log('✅ Content-loader finalizado, carregando notícias...');
                clearInterval(checkInterval);
                loadHomeNews();
            } else if (attempts >= maxAttempts) {
                console.log('⚠️ Tempo limite excedido, carregando notícias mesmo assim...');
                clearInterval(checkInterval);
                loadHomeNews();
            }
        }, 200);
    }

    // ============================================
    // 8. MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (typeof originalSwitch === 'function') {
            originalSwitch(lang);
        } else {
            localStorage.setItem('preferred_lang', lang);
            if (typeof window.loadContent === 'function') {
                window.loadContent();
            }
        }
        
        setTimeout(function() {
            console.log('🔄 Idioma alterado, recarregando notícias da home...');
            loadHomeNews();
        }, 800);
    };

    // ============================================
    // 9. EXPOR FUNÇÕES
    // ============================================
    window.loadHomeNews = loadHomeNews;
    window.openHomeNewsModal = openHomeNewsModal;
    window.closeHomeNewsModal = closeHomeNewsModal;

    // ============================================
    // 10. INICIAR
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHome);
    } else {
        initHome();
    }

})();