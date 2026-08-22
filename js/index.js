(function() {
    'use strict';

    console.log('🏠 index.js carregado');

    // ============================================
    // 1. CORES POR CATEGORIA
    // ============================================
    const CATEGORY_COLORS = {
        'Research': '#BA0225',
        'Training': '#1A6B6B',
        'Partnership': '#D1964F',
        'Data': '#1A6B6B',
        'Event': '#4A4A4A',
        'Announcement': '#7C3AED'
    };

    // ============================================
    // 2. FUNÇÕES AUXILIARES
    // ============================================
    function getText(id) {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
    }

    function formatDate(dateStr) {
        const months = {
            '01': 'January', '02': 'February', '03': 'March', '04': 'April',
            '05': 'May', '06': 'June', '07': 'July', '08': 'August',
            '09': 'September', '10': 'October', '11': 'November', '12': 'December'
        };
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = months[parts[1]] || parts[1];
            const day = parts[2];
            return `${month} ${parseInt(day)}, ${year}`;
        }
        return dateStr;
    }

    function parseFilename(filename) {
        const parts = filename.replace('.md', '').split('-');
        const year = parts[0];
        const month = parts[1];
        const rest = parts.slice(2).join('-').replace(/_/g, ' ');
        
        let category = 'Research';
        const filenameLower = filename.toLowerCase();
        if (filenameLower.includes('credo') || filenameLower.includes('fellowship') || filenameLower.includes('workshop') || filenameLower.includes('ifors')) {
            category = 'Training';
        } else if (filenameLower.includes('paho') || filenameLower.includes('partnership')) {
            category = 'Partnership';
        } else if (filenameLower.includes('data') || filenameLower.includes('database') || filenameLower.includes('records')) {
            category = 'Data';
        } else if (filenameLower.includes('summit') || filenameLower.includes('event')) {
            category = 'Event';
        } else if (filenameLower.includes('who') || filenameLower.includes('announcement') || filenameLower.includes('open_submissions')) {
            category = 'Announcement';
        }
        
        return {
            filename: filename,
            year: year,
            month: month,
            dateSort: `${year}-${month}`,
            category: category,
            slug: rest || filename
        };
    }

    function extractMetadata(content) {
        const lines = content.split('\n');
        let metadata = {};
        let inMetadata = false;
        let contentStart = 0;
        
        if (lines[0].trim() === '---') {
            inMetadata = true;
            let i = 1;
            while (i < lines.length) {
                if (lines[i].trim() === '---') {
                    inMetadata = false;
                    contentStart = i + 1;
                    break;
                }
                const line = lines[i];
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();
                    metadata[key] = value.replace(/^["']|["']$/g, '');
                }
                i++;
            }
        }
        
        if (Object.keys(metadata).length === 0) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('# ')) {
                    metadata.title = line.replace('# ', '').trim();
                    contentStart = i + 1;
                    break;
                }
            }
        }
        
        return { metadata, contentStart };
    }

    // ============================================
    // 3. CARREGAR NOTÍCIAS NA HOME
    // ============================================
    async function loadHomeNews() {
        try {
            const lang = localStorage.getItem('preferred_lang') || 'pt';
            
            const response = await fetch('./content/news.json');
            if (!response.ok) {
                console.warn('Não foi possível carregar as notícias para a home');
                return;
            }
            const data = await response.json();
            const langData = data[lang] || data.pt;

            if (!langData || !langData['news-files']) {
                console.warn('Lista de arquivos não encontrada');
                return;
            }

            const fileList = langData['news-files'];
            const newsItems = [];

            for (const file of fileList) {
                try {
                    const contentResponse = await fetch(`./content/newspages/${file}`);
                    if (!contentResponse.ok) continue;
                    
                    const content = await contentResponse.text();
                    const fileMeta = parseFilename(file);
                    const { metadata, contentStart } = extractMetadata(content);
                    
                    let title = metadata[`title_${lang}`] || metadata.title || fileMeta.slug;
                    let excerpt = metadata[`excerpt_${lang}`] || metadata.excerpt || '';
                    let image = metadata.image || `${file.replace('.md', '.png')}`;
                    let date = metadata.date || `${fileMeta.year}-${fileMeta.month}-01`;
                    let category = metadata.category || fileMeta.category;
                    
                    if (!excerpt) {
                        const lines = content.split('\n');
                        for (let i = contentStart; i < lines.length && i < contentStart + 10; i++) {
                            const line = lines[i].trim();
                            if (line && !line.startsWith('#') && !line.startsWith('---')) {
                                excerpt = line;
                                if (excerpt.length > 120) excerpt = excerpt.substring(0, 120) + '...';
                                break;
                            }
                        }
                    }
                    
                    if (!title || title === fileMeta.slug) {
                        const lines = content.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line.startsWith('# ')) {
                                title = line.replace('# ', '').trim();
                                break;
                            }
                        }
                    }
                    
                    const imagePath = `./assets/news/${image}`;
                    let hasImage = false;
                    try {
                        const imgCheck = await fetch(imagePath, { method: 'HEAD' });
                        hasImage = imgCheck.ok;
                    } catch {
                        hasImage = false;
                    }

                    newsItems.push({
                        date: formatDate(date),
                        dateSort: date,
                        category: category,
                        title: title || `Notícia ${fileMeta.slug}`,
                        excerpt: excerpt || 'Leia mais sobre esta notícia...',
                        image: hasImage ? imagePath : './assets/news/default.png',
                        imageAlt: title || 'Notícia',
                        filename: file,
                        slug: fileMeta.slug,
                        year: fileMeta.year,
                        month: fileMeta.month
                    });

                } catch (error) {
                    console.error(`Erro ao carregar ${file}:`, error);
                }
            }

            newsItems.sort((a, b) => b.dateSort.localeCompare(a.dateSort));
            const latestNews = newsItems.slice(0, 5);
            
            renderHomeNews(latestNews);

        } catch (error) {
            console.error('Erro ao carregar notícias na home:', error);
        }
    }

    // ============================================
    // 4. RENDERIZAR NOTÍCIAS NA HOME
    // ============================================
    function renderHomeNews(newsItems) {
        if (!newsItems || newsItems.length === 0) {
            console.warn('Nenhuma notícia para exibir na home');
            const section = document.getElementById('latest-news');
            if (section) section.style.display = 'none';
            return;
        }

        const featured = newsItems[0];
        const thumbs = newsItems.slice(1, 5);

        // ============================================
        // FEATURED (notícia principal)
        // ============================================
        const featuredImg = document.getElementById('news-featured-image');
        const featuredBadge = document.getElementById('news-featured-badge');
        const featuredDate = document.getElementById('news-featured-date');
        const featuredTitle = document.getElementById('news-featured-title');
        const featuredExcerpt = document.getElementById('news-featured-excerpt');
        const featuredLink = document.getElementById('news-featured-link');

        if (featuredImg) {
            featuredImg.src = featured.image;
            featuredImg.alt = featured.imageAlt || 'Notícia em destaque';
        }
        if (featuredBadge) {
            const categoryText = getText(`filter-${featured.category.toLowerCase()}`) || featured.category;
            featuredBadge.textContent = categoryText;
            const color = CATEGORY_COLORS[featured.category] || '#BA0225';
            featuredBadge.style.background = color;
        }
        if (featuredDate) featuredDate.textContent = featured.date;
        if (featuredTitle) featuredTitle.textContent = featured.title;
        if (featuredExcerpt) featuredExcerpt.textContent = featured.excerpt;
        if (featuredLink) {
            // NÃO SOBRESCREVE O TEXTO - apenas adiciona o evento
            featuredLink.href = '#';
            featuredLink.dataset.filename = featured.filename;
            
            const newLink = featuredLink.cloneNode(true);
            featuredLink.parentNode.replaceChild(newLink, featuredLink);
            
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                const filename = this.dataset.filename;
                if (filename) {
                    if (typeof window.openNewsModal === 'function') {
                        window.openNewsModal(filename);
                    } else {
                        window.location.href = 'pages/news.html';
                    }
                }
            });
        }

        // ============================================
        // THUMBS (4 notícias menores)
        // ============================================
        const thumbConfigs = [
            { id: 1, badgeId: 'news-thumb-1-badge', dateId: 'news-thumb-1-date', titleId: 'news-thumb-1-title', linkId: 'news-thumb-1-link', imgId: 'news-thumb-1-image' },
            { id: 2, badgeId: 'news-thumb-2-badge', dateId: 'news-thumb-2-date', titleId: 'news-thumb-2-title', linkId: 'news-thumb-2-link', imgId: 'news-thumb-2-image' },
            { id: 3, badgeId: 'news-thumb-3-badge', dateId: 'news-thumb-3-date', titleId: 'news-thumb-3-title', linkId: 'news-thumb-3-link', imgId: 'news-thumb-3-image' },
            { id: 4, badgeId: 'news-thumb-4-badge', dateId: 'news-thumb-4-date', titleId: 'news-thumb-4-title', linkId: 'news-thumb-4-link', imgId: 'news-thumb-4-image' }
        ];

        thumbs.forEach((news, index) => {
            if (index >= thumbConfigs.length) return;
            const config = thumbConfigs[index];
            
            const img = document.getElementById(config.imgId);
            const badge = document.getElementById(config.badgeId);
            const date = document.getElementById(config.dateId);
            const title = document.getElementById(config.titleId);
            const link = document.getElementById(config.linkId);

            if (img) {
                img.src = news.image;
                img.alt = news.imageAlt || 'Notícia';
                const container = img.closest('.news-thumb');
                if (container) container.style.display = 'flex';
            }
            if (badge) {
                const categoryText = getText(`filter-${news.category.toLowerCase()}`) || news.category;
                badge.textContent = categoryText;
                const color = CATEGORY_COLORS[news.category] || '#4A4A4A';
                badge.style.background = color;
            }
            if (date) date.textContent = news.date;
            if (title) title.textContent = news.title;
            if (link) {
                // NÃO SOBRESCREVE O TEXTO - apenas adiciona o evento
                link.href = '#';
                link.dataset.filename = news.filename;
                
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);
                
                newLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    const filename = this.dataset.filename;
                    if (filename) {
                        if (typeof window.openNewsModal === 'function') {
                            window.openNewsModal(filename);
                        } else {
                            window.location.href = 'pages/news.html';
                        }
                    }
                });
            }
        });

        for (let i = thumbs.length; i < thumbConfigs.length; i++) {
            const config = thumbConfigs[i];
            const container = document.getElementById(config.imgId)?.closest('.news-thumb');
            if (container) {
                container.style.display = 'none';
            }
        }
    }

    // ============================================
    // 5. INICIALIZAÇÃO DA HOME
    // ============================================
    function initHome() {
        console.log('🏠 Inicializando home...');

        let attempts = 0;
        const maxAttempts = 20;
        
        const checkInterval = setInterval(function() {
            attempts++;
            const linkEl = document.getElementById('news-featured-link');
            
            if (linkEl && linkEl.textContent && linkEl.textContent.trim() !== '') {
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
    // 6. MUDANÇA DE IDIOMA
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
    // 7. EXPOR FUNÇÕES
    // ============================================
    window.loadHomeNews = loadHomeNews;


    // ============================================
    // 8. INICIAR
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHome);
    } else {
        initHome();
    }

})();