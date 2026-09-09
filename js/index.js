(function() {
    'use strict';

    console.log('🏠 index.js carregado');

    // ============================================
    // 0. CONFIGURAÇÃO DE BASE PATH - DETECÇÃO AUTOMÁTICA
    // ============================================
    function getBasePath() {
        // Obtém o caminho completo da página
        const pathname = window.location.pathname;
        
        // Se estiver no GitHub Pages (contém github.io)
        if (window.location.hostname.includes('github.io')) {
            // Pega o nome do repositório
            const parts = pathname.split('/').filter(p => p !== '');
            if (parts.length > 0) {
                // Se o primeiro segmento não tem ponto (não é um arquivo)
                if (!parts[0].includes('.')) {
                    return '/' + parts[0] + '/';
                }
            }
            return '/';
        }
        
        // Local (LiveServer, etc)
        return '';
    }

    const BASE_PATH = getBasePath();
    console.log('📍 Base Path:', BASE_PATH || '(root)');
    console.log('📍 Pathname:', window.location.pathname);

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
    // 2. ESTADO GLOBAL
    // ============================================
    let allNews = [];
    let modalInitialized = false;

    // ============================================
    // 3. FUNÇÕES AUXILIARES
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
        const parts = filename.replace(/\.[^/.]+$/, '').split('-');
        const year = parts[0];
        const month = parts[1];
        const rest = parts.slice(2).join('-').replace(/_/g, ' ');
        
        let category = 'Research';
        const filenameLower = filename.toLowerCase();
        if (filenameLower.includes('credo') || filenameLower.includes('fellowship') || 
            filenameLower.includes('workshop') || filenameLower.includes('ifors')) {
            category = 'Training';
        } else if (filenameLower.includes('paho') || filenameLower.includes('partnership')) {
            category = 'Partnership';
        } else if (filenameLower.includes('data') || filenameLower.includes('database') || 
                   filenameLower.includes('records')) {
            category = 'Data';
        } else if (filenameLower.includes('summit') || filenameLower.includes('event')) {
            category = 'Event';
        } else if (filenameLower.includes('who') || filenameLower.includes('announcement') || 
                   filenameLower.includes('open_submissions')) {
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
    // 4. FUNÇÃO PARA VERIFICAR SE IMAGEM EXISTE
    // ============================================
    async function imageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    // ============================================
    // 5. CARREGAR NOTÍCIAS NA HOME
    // ============================================
    async function loadHomeNews() {
        try {
            const lang = localStorage.getItem('preferred_lang') || 'pt';
            
            const jsonUrl = `${BASE_PATH}content/news.json`;
            console.log('📡 Buscando news.json em:', jsonUrl);
            
            const response = await fetch(jsonUrl);
            
            if (!response.ok) {
                console.warn('❌ Não foi possível carregar news.json');
                return;
            }
            
            const data = await response.json();
            console.log('✅ news.json carregado:', data);
            
            const langData = data[lang] || data.pt;

            if (!langData || !langData['news-files']) {
                console.warn('❌ Lista de arquivos não encontrada');
                return;
            }

            const fileList = langData['news-files'];
            console.log('📄 Arquivos encontrados:', fileList);
            
            const newsItems = [];

            for (const file of fileList) {
                try {
                    const fileUrl = `${BASE_PATH}content/newspages/${file}`;
                    console.log('📂 Tentando carregar:', fileUrl);
                    
                    const contentResponse = await fetch(fileUrl);
                    if (!contentResponse.ok) {
                        console.warn(`❌ Arquivo não encontrado: ${file}`);
                        continue;
                    }
                    
                    const content = await contentResponse.text();
                    console.log(`✅ Carregado: ${file}`);
                    
                    const fileMeta = parseFilename(file);
                    const { metadata } = extractMetadata(content);
                    
                    let title = metadata[`title_${lang}`] || metadata.title || fileMeta.slug;
                    let excerpt = metadata[`excerpt_${lang}`] || metadata.excerpt || '';
                    let image = metadata.image || `${file.replace(/\.[^/.]+$/, '')}.png`;
                    let date = metadata.date || `${fileMeta.year}-${fileMeta.month}-01`;
                    let category = metadata.category || fileMeta.category;
                    let readTime = metadata.readTime || '3 min read';
                    
                    if (!excerpt) {
                        const lines = content.split('\n');
                        for (let i = 0; i < lines.length && i < 20; i++) {
                            const line = lines[i].trim();
                            if (line && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('[')) {
                                excerpt = line;
                                if (excerpt.length > 150) excerpt = excerpt.substring(0, 150) + '...';
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
                    
                    const imagePath = `${BASE_PATH}assets/news/${image}`;
                    const hasImage = await imageExists(imagePath);
                    
                    newsItems.push({
                        date: formatDate(date),
                        dateSort: date,
                        category: category,
                        title: title || `Notícia ${fileMeta.slug}`,
                        excerpt: excerpt || 'Leia mais sobre esta notícia...',
                        image: hasImage ? imagePath : `${BASE_PATH}assets/news/default.png`,
                        imageAlt: title || 'Notícia',
                        readTime: readTime,
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
            allNews = newsItems;
            
            console.log(`📊 Total de notícias carregadas: ${allNews.length}`);
            
            const latestNews = newsItems.slice(0, 5);
            
            if (latestNews.length > 0) {
                renderHomeNews(latestNews);
                console.log(`✅ ${latestNews.length} notícias carregadas na home`);
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
    // 6. RENDERIZAR NOTÍCIAS NA HOME
    // ============================================
    function renderHomeNews(newsItems) {
        if (!newsItems || newsItems.length === 0) {
            console.warn('⚠️ Nenhuma notícia para exibir na home');
            const section = document.getElementById('latest-news');
            if (section) section.style.display = 'none';
            return;
        }

        const featured = newsItems[0];
        const thumbs = newsItems.slice(1, 5);

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
                this.src = `${BASE_PATH}assets/news/default.png`;
            };
            featuredImg.style.display = 'block';
        }
        
        if (featuredBadge) {
            const categoryText = getText(`filter-${featured.category.toLowerCase()}`) || featured.category;
            featuredBadge.textContent = categoryText;
            const color = CATEGORY_COLORS[featured.category] || '#BA0225';
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
                    this.src = `${BASE_PATH}assets/news/default.png`;
                };
                img.style.display = 'block';
            }
            
            if (badge) {
                const categoryText = getText(`filter-${news.category.toLowerCase()}`) || news.category;
                badge.textContent = categoryText;
                const color = CATEGORY_COLORS[news.category] || '#4A4A4A';
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

        for (let i = thumbs.length; i < thumbConfigs.length; i++) {
            const config = thumbConfigs[i];
            const container = document.getElementById(config.containerId);
            if (container) {
                container.style.display = 'none';
            }
        }
    }

    // ============================================
    // 7. MODAL PARA A HOME
    // ============================================
    function openHomeNewsModal(filename) {
        const modal = document.getElementById('news-modal');
        const body = document.getElementById('news-modal-body');
        
        if (!modal || !body) {
            console.warn('⚠️ Modal não encontrado, redirecionando para página de notícias');
            window.location.href = `${BASE_PATH}pages/news.html`;
            return;
        }

        body.innerHTML = `<p style="text-align: center; padding: 40px 0; color: #4A4A4A;">Carregando...</p>`;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const url = `${BASE_PATH}content/newspages/${filename}`;
        console.log('📂 Abrindo modal com:', url);

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

                function processMarkdown(text) {
                    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
                        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #BA0225; text-decoration: underline;">$1</a>');
                    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    return text;
                }
                
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
                    
                    if (trimmed.startsWith('## ')) {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        const text = trimmed.replace(/^##\s*/, '');
                        contentHtml += `<h2>${text}</h2>`;
                        continue;
                    }
                    
                    if (trimmed.startsWith('### ')) {
                        if (inList) {
                            contentHtml += '</ul>';
                            inList = false;
                        }
                        const text = trimmed.replace(/^###\s*/, '');
                        contentHtml += `<h3>${text}</h3>`;
                        continue;
                    }
                    
                    if (trimmed.startsWith('- ')) {
                        if (!inList) {
                            contentHtml += '<ul>';
                            inList = true;
                        }
                        const text = trimmed.replace(/^-\s*/, '');
                        contentHtml += `<li>${processMarkdown(text)}</li>`;
                        continue;
                    }
                    
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
    // 8. FECHAR MODAL
    // ============================================
    function closeHomeNewsModal() {
        const modal = document.getElementById('news-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // 9. INICIALIZAR MODAL
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
    // 10. INICIALIZAÇÃO DA HOME
    // ============================================
    function initHome() {
        console.log('🏠 Inicializando home...');
        console.log('📍 Ambiente:', window.location.hostname);
        console.log('📍 Base Path:', BASE_PATH || '(root)');

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
    // 11. MUDANÇA DE IDIOMA
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
    // 12. EXPOR FUNÇÕES
    // ============================================
    window.loadHomeNews = loadHomeNews;
    window.openHomeNewsModal = openHomeNewsModal;
    window.closeHomeNewsModal = closeHomeNewsModal;

    // ============================================
    // 13. INICIAR
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHome);
    } else {
        initHome();
    }

})();