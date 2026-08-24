(function() {
    'use strict';

    console.log('📰 news.js carregado');

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
    // 2. ESTADO
    // ============================================
    let allNews = [];
    let filteredNews = [];
    let activeCategory = 'All';

    // ============================================
    // 3. FUNÇÃO PARA PEGAR TEXTO DO DOM
    // ============================================
    function getText(id) {
        const el = document.getElementById(id);
        return el ? el.textContent.trim() : '';
    }

    // ============================================
    // 4. FUNÇÃO PARA FORMATAR DATA
    // ============================================
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

    // ============================================
    // 5. EXTRAIR METADADOS DO NOME DO ARQUIVO
    // ============================================
    function parseFilename(filename) {
        // const parts = filename.replace('.md', '').split('-');
        const parts = filename.replace(/\.[^/.]+$/, '').split('-');
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

    // ============================================
    // 6. EXTRAIR METADADOS DO CONTEÚDO .MD
    // ============================================
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
    // 7. CARREGAR NOTÍCIAS
    // ============================================
    async function loadNews() {
        try {
            const lang = localStorage.getItem('preferred_lang') || 'pt';
            
            const response = await fetch('../content/news.json');
            if (!response.ok) {
                throw new Error('Não foi possível carregar o arquivo news.json');
            }
            const data = await response.json();
            const langData = data[lang] || data.pt;

            if (!langData || !langData['news-files']) {
                console.error('Lista de arquivos não encontrada no JSON');
                return;
            }

            const fileList = langData['news-files'];
            const newsItems = [];

            for (const file of fileList) {
                try {
                    const contentResponse = await fetch(`../content/newspages/${file}`);
                    if (!contentResponse.ok) {
                        console.warn(`Arquivo não encontrado: ${file}`);
                        continue;
                    }
                    
                    const content = await contentResponse.text();
                    const fileMeta = parseFilename(file);
                    
                    const { metadata, contentStart } = extractMetadata(content);
                    
                    let title = metadata[`title_${lang}`] || metadata.title || fileMeta.slug;
                    let excerpt = metadata[`excerpt_${lang}`] || metadata.excerpt || '';
                    let readTime = metadata[`readTime_${lang}`] || metadata.readTime || '3 min read';
                    let image = metadata.image || `${file.replace(/\.[^/.]+$/, '')}.png`;
                    // let image = metadata.image || `${file.replace('.md', '.png')}`;
                    let date = metadata.date || `${fileMeta.year}-${fileMeta.month}-01`;
                    let category = metadata.category || fileMeta.category;
                    let featured = metadata.featured === 'true';
                    let doi = metadata.doi || '';
                    
                    if (!excerpt) {
                        const lines = content.split('\n');
                        for (let i = contentStart; i < lines.length && i < contentStart + 10; i++) {
                            const line = lines[i].trim();
                            if (line && !line.startsWith('#') && !line.startsWith('---')) {
                                excerpt = line;
                                if (excerpt.length > 200) excerpt = excerpt.substring(0, 200) + '...';
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
                    
                    const imagePath = `../assets/news/${image}`;
                    let hasImage = false;
                    try {
                        const imgCheck = await fetch(imagePath, { method: 'HEAD' });
                        hasImage = imgCheck.ok;
                    } catch {
                        hasImage = false;
                    }

                    newsItems.push({
                        id: newsItems.length + 1,
                        date: formatDate(date),
                        dateSort: date,
                        category: category,
                        title: title || `Notícia ${fileMeta.slug}`,
                        excerpt: excerpt || 'Leia mais sobre esta notícia...',
                        image: hasImage ? imagePath : '../assets/news/default.png',
                        imageAlt: title || 'Notícia',
                        readTime: readTime,
                        filename: file,
                        slug: fileMeta.slug,
                        year: fileMeta.year,
                        month: fileMeta.month,
                        featured: featured,
                        doi: doi
                    });

                } catch (error) {
                    console.error(`Erro ao carregar ${file}:`, error);
                }
            }

            newsItems.sort((a, b) => b.dateSort.localeCompare(a.dateSort));

            if (newsItems.length > 0 && !newsItems.some(n => n.featured)) {
                newsItems[0].featured = true;
            }

            allNews = newsItems;
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
    // 8. RENDERIZAR FILTROS
    // ============================================
    function renderFilters() {
        const container = document.getElementById('filter-pills');
        if (!container) return;

        const categories = ['All', ...new Set(allNews.map(n => n.category))];
        const allText = getText('filter-all') || 'All';

        container.innerHTML = categories.map(cat => {
            const label = cat === 'All' ? allText : getText(`filter-${cat.toLowerCase()}`) || cat;
            const isActive = cat === activeCategory;
            const color = cat === 'All' ? '#BA0225' : (CATEGORY_COLORS[cat] || '#4A4A4A');
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
    // 9. RENDERIZAR CATEGORIAS (sidebar)
    // ============================================
    function renderCategories() {
        const container = document.getElementById('categories-list');
        if (!container) return;

        const categories = [...new Set(allNews.map(n => n.category))];

        const counts = {};
        allNews.forEach(n => {
            counts[n.category] = (counts[n.category] || 0) + 1;
        });

        container.innerHTML = categories.map(cat => {
            const label = getText(`filter-${cat.toLowerCase()}`) || cat;
            const isActive = cat === activeCategory;
            const color = CATEGORY_COLORS[cat] || '#4A4A4A';
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
    // 10. FILTRAR NOTÍCIAS
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
    // 11. RENDERIZAR NOTÍCIAS
    // ============================================
    function renderNews() {
        const featuredContainer = document.getElementById('featured-article');
        const listContainer = document.getElementById('article-list');

        const featuredText = getText('featured') || 'Featured';
        const readFullStory = getText('read-full-story') || 'Read full story →';
        const readMore = getText('read-more') || 'Read more →';

        // Featured article
        const featured = filteredNews.find(n => n.featured);
        if (featured && featuredContainer) {
            const color = CATEGORY_COLORS[featured.category] || '#4A4A4A';
            featuredContainer.innerHTML = `
                <article class="featured-card">
                    <div class="featured-image">
                        <img src="${featured.image}" alt="${featured.imageAlt}" loading="lazy" 
                             onerror="this.src='../assets/news/default.png'">
                        <span class="featured-category" style="background: ${color};">${getText(`filter-${featured.category.toLowerCase()}`) || featured.category}</span>
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
                listContainer.innerHTML = `<p class="no-news">${getText('no-news') || 'Nenhuma notícia encontrada.'}</p>`;
                return;
            }

            listContainer.innerHTML = rest.map(n => {
                const color = CATEGORY_COLORS[n.category] || '#4A4A4A';
                return `
                    <article class="article-item">
                        <div class="article-image">
                            <img src="${n.image}" alt="${n.imageAlt}" loading="lazy"
                                 onerror="this.src='../assets/news/default.png'">
                        </div>
                        <div class="article-content">
                            <span class="article-category" style="background: ${color};">${getText(`filter-${n.category.toLowerCase()}`) || n.category}</span>
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
    // 12. MODAL - ABRIR NOTÍCIA COMPLETA
    // ============================================
    function openNewsModal(filename) {
        const modal = document.getElementById('news-modal');
        const body = document.getElementById('news-modal-body');
        
        if (!modal || !body) return;

        body.innerHTML = `<p style="text-align: center; padding: 40px 0; color: #4A4A4A;">Carregando...</p>`;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // DETECTA SE ESTÁ NA HOME OU EM PAGES/
        const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
        const basePath = isHome ? './content/newspages/' : '../content/newspages/';
        const url = basePath + filename;

        console.log('📂 Buscando:', url);

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Notícia não encontrada');
                return response.text();
            })
            .then(content => {
                const lang = localStorage.getItem('preferred_lang') || 'pt';
                
                const lines = content.split('\n');
                let title = '';
                let contentHtml = '';
                let inContent = false;
                let languageFound = false;
                
                const langMarker = `# ${lang.toUpperCase()}`;
                
                let contentLines = [];
                let foundLang = false;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    if (line === langMarker) {
                        foundLang = true;
                        inContent = true;
                        continue;
                    }
                    
                    if (inContent && line.match(/^# (PT|EN|ES)$/)) {
                        break;
                    }
                    
                    if (inContent) {
                        contentLines.push(lines[i]);
                    }
                }
                
                if (!foundLang) {
                    let startCollecting = false;
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!startCollecting && line.match(/^# (PT|EN|ES)$/)) {
                            startCollecting = true;
                            continue;
                        }
                        if (startCollecting && line.match(/^# (PT|EN|ES)$/)) {
                            break;
                        }
                        if (startCollecting) {
                            contentLines.push(lines[i]);
                        }
                    }
                }
                
                if (contentLines.length === 0) {
                    contentLines = lines;
                }
                
                // ============================================
                // FUNÇÃO PARA PROCESSAR LINKS MARKDOWN
                // ============================================
                function processMarkdown(text) {
                    // Processa links: [texto](url)
                    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #BA0225; text-decoration: underline;">$1</a>');
                    
                    // Processa negrito: **texto**
                    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    
                    // Processa itálico: *texto*
                    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    
                    return text;
                }
                
                // ============================================
                // LOOP DE PROCESSAMENTO
                // ============================================
                let inList = false;
                
                for (let i = 0; i < contentLines.length; i++) {
                    let line = contentLines[i];
                    let trimmed = line.trim();
                    
                    if (trimmed === '') {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        contentHtml += '<br>';
                        continue;
                    }
                    
                    // Título principal (# )
                    if (trimmed.startsWith('# ')) {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        const text = trimmed.replace(/^#\s*/, '');
                        if (!title) title = text;
                        contentHtml += `<h1>${text}</h1>`;
                        continue;
                    }
                    
                    // Subtítulo (## )
                    if (trimmed.startsWith('## ')) {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        const text = trimmed.replace(/^##\s*/, '');
                        contentHtml += `<h2>${text}</h2>`;
                        continue;
                    }
                    
                    // Sub-subtítulo (### )
                    if (trimmed.startsWith('### ')) {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        const text = trimmed.replace(/^###\s*/, '');
                        contentHtml += `<h3>${text}</h3>`;
                        continue;
                    }
                    
                    // Lista (- )
                    if (trimmed.startsWith('- ')) {
                        if (!inList) {
                            contentHtml += '<ul>';
                            inList = true;
                        }
                        const text = trimmed.replace(/^-\s*/, '');
                        contentHtml += `<li>${processMarkdown(text)}</li>`;
                        continue;
                    }
                    
                    // Linha com DOI (identifica e processa)
                    if (trimmed.includes('DOI:') || trimmed.includes('doi:')) {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        // Processa a linha com markdown (links, negrito, etc.)
                        contentHtml += `<p>${processMarkdown(trimmed)}</p>`;
                        continue;
                    }
                    
                    // Negrito no início e fim (**texto**)
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        const text = trimmed.replace(/\*\*/g, '');
                        contentHtml += `<p><strong>${text}</strong></p>`;
                        continue;
                    }
                    
                    // Qualquer outra linha - processa markdown
                    if (inList) {
                        contentHtml += '</ul>';
                        inList = false;
                    }
                    contentHtml += `<p>${processMarkdown(trimmed)}</p>`;
                }
                
                if (inList) {
                    contentHtml += '</ul>';
                }
                
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
    // 13. FECHAR MODAL
    // ============================================
    function closeNewsModal() {
        const modal = document.getElementById('news-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // 14. INICIALIZAR MODAL
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
    // 15. NEWSLETTER
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
    // 16. INICIALIZAÇÃO
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
    // 17. MUDANÇA DE IDIOMA
    // ============================================
    const originalSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
        if (originalSwitch) originalSwitch(lang);
        setTimeout(() => {
            loadNews();
        }, 500);
    };

    // ============================================
    // 18. EXPOR FUNÇÕES
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