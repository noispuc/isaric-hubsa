// ============================================
// NEWS-SHARED.JS — Módulo compartilhado para notícias
// Usado por index.js (home) e news.js (página de notícias)
// ============================================
(function() {
    'use strict';

    // ============================================
    // 1. CONSTANTES
    // ============================================
    const CATEGORY_COLORS = {
        'Research': '#BA0225',
        'Training': '#1A6B6B',
        'Partnership': '#D1964F',
        'Data': '#1A6B6B',
        'Event': '#4A4A4A',
        'Announcement': '#7C3AED'
    };

    const CACHE_KEY = 'isaric_news_cache';
    const CACHE_VERSION_KEY = 'isaric_news_cache_version';
    const CACHE_VERSION = '1'; // Incrementar quando a estrutura mudar

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

    // ============================================
    // 3. EXTRAIR METADADOS DO NOME DO ARQUIVO
    // ============================================
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

    // ============================================
    // 4. EXTRAIR METADADOS DO CONTEÚDO .MD (frontmatter YAML)
    // ============================================
    function extractMetadata(content) {
        const lines = content.split('\n');
        let metadata = {};
        let contentStart = 0;
        
        if (lines[0].trim() === '---') {
            let i = 1;
            while (i < lines.length) {
                if (lines[i].trim() === '---') {
                    contentStart = i + 1;
                    break;
                }
                const line = lines[i];
                // Usar apenas o primeiro ":" como separador para suportar valores com ":"
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
    // 5. PROCESSAR MARKDOWN → HTML
    // ============================================
    function processMarkdown(text) {
        // Processa links: [texto](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
            '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #BA0225; text-decoration: underline;">$1</a>');
        // Processa negrito: **texto**
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Processa itálico: *texto*
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return text;
    }

    // ============================================
    // 6. RENDERIZAR CONTEÚDO MD COMO HTML (para modal)
    // ============================================
    function renderMarkdownToHtml(contentLines) {
        let contentHtml = '';
        let title = '';
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
            
            // Linha com DOI
            if (trimmed.includes('DOI:') || trimmed.includes('doi:')) {
                if (inList) {
                    contentHtml += '</ul>';
                    inList = false;
                }
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
            
            // Qualquer outra linha
            if (inList) {
                contentHtml += '</ul>';
                inList = false;
            }
            contentHtml += `<p>${processMarkdown(trimmed)}</p>`;
        }
        
        if (inList) {
            contentHtml += '</ul>';
        }
        
        return { title, contentHtml };
    }

    // ============================================
    // 7. EXTRAIR CONTEÚDO POR IDIOMA
    // ============================================
    function extractContentByLang(content, lang) {
        const lines = content.split('\n');
        const langMarker = `# ${lang.toUpperCase()}`;
        let contentLines = [];
        let foundLang = false;
        let inContent = false;
        
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
        
        // Fallback: se não achou o idioma, usar o primeiro bloco de idioma disponível
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
        
        // Fallback final: usar todo o conteúdo
        if (contentLines.length === 0) {
            contentLines = lines;
        }
        
        return contentLines;
    }

    // ============================================
    // 8. CACHE — Ler / Gravar no sessionStorage
    // ============================================
    function getCachedNews(lang) {
        try {
            const version = sessionStorage.getItem(CACHE_VERSION_KEY);
            if (version !== CACHE_VERSION) {
                sessionStorage.removeItem(CACHE_KEY);
                return null;
            }
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            if (data.lang !== lang) return null;
            
            return data.items;
        } catch {
            return null;
        }
    }

    function setCachedNews(lang, items) {
        try {
            sessionStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                lang: lang,
                items: items,
                timestamp: Date.now()
            }));
        } catch {
            // sessionStorage pode estar cheio ou indisponível
            console.warn('⚠️ Não foi possível salvar cache de notícias');
        }
    }

    // ============================================
    // 9. CARREGAR E PARSEAR TODAS AS NOTÍCIAS
    // ============================================
    async function loadNewsData(basePath) {
        const lang = localStorage.getItem('preferred_lang') || 'pt';
        
        // Verificar cache
        const cached = getCachedNews(lang);
        if (cached) {
            console.log(`📦 ${cached.length} notícias carregadas do cache`);
            return cached;
        }
        
        // Carregar news.json
        const jsonUrl = `${basePath}content/news.json`;
        console.log('📡 Buscando news.json em:', jsonUrl);
        
        const response = await fetch(jsonUrl);
        if (!response.ok) {
            throw new Error(`Não foi possível carregar news.json (status: ${response.status})`);
        }
        
        const data = await response.json();
        const langData = data[lang] || data.pt;

        if (!langData || !langData['news-files']) {
            throw new Error('Lista de arquivos não encontrada no JSON');
        }

        const fileList = langData['news-files'];
        console.log('📄 Arquivos encontrados:', fileList.length);
        
        const newsItems = [];

        for (const file of fileList) {
            try {
                const fileUrl = `${basePath}content/newspages/${file}`;
                
                const contentResponse = await fetch(fileUrl);
                if (!contentResponse.ok) {
                    console.warn(`❌ Arquivo não encontrado: ${file}`);
                    continue;
                }
                
                const content = await contentResponse.text();
                console.log(`✅ Carregado: ${file}`);
                
                const fileMeta = parseFilename(file);
                const { metadata, contentStart } = extractMetadata(content);
                
                let title = metadata[`title_${lang}`] || metadata.title || fileMeta.slug;
                let excerpt = metadata[`excerpt_${lang}`] || metadata.excerpt || '';
                let readTime = metadata[`readTime_${lang}`] || metadata.readTime || '3 min read';
                let image = metadata.image || `${file.replace(/\.[^/.]+$/, '')}.png`;
                let date = metadata.date || `${fileMeta.year}-${fileMeta.month}-01`;
                let category = metadata.category || fileMeta.category;
                let featured = metadata.featured === 'true';
                let doi = metadata.doi || '';
                
                // Extrair excerpt do conteúdo se não houver no frontmatter
                if (!excerpt) {
                    const lines = content.split('\n');
                    for (let i = contentStart; i < lines.length && i < contentStart + 10; i++) {
                        const line = lines[i].trim();
                        if (line && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('[')) {
                            excerpt = line;
                            if (excerpt.length > 200) excerpt = excerpt.substring(0, 200) + '...';
                            break;
                        }
                    }
                }
                
                // Extrair título do conteúdo se não houver no frontmatter
                if (!title || title === fileMeta.slug) {
                    const lines = content.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.startsWith('# ') && !line.match(/^# (PT|EN|ES)$/)) {
                            title = line.replace('# ', '').trim();
                            break;
                        }
                    }
                }
                
                newsItems.push({
                    id: newsItems.length + 1,
                    date: formatDate(date),
                    dateSort: date,
                    category: category,
                    title: title || `Notícia ${fileMeta.slug}`,
                    excerpt: excerpt || 'Leia mais sobre esta notícia...',
                    image: image,
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

        // Ordenar por data (mais recente primeiro)
        newsItems.sort((a, b) => b.dateSort.localeCompare(a.dateSort));

        // Garantir que pelo menos uma notícia seja featured
        if (newsItems.length > 0 && !newsItems.some(n => n.featured)) {
            newsItems[0].featured = true;
        }

        // Salvar no cache
        setCachedNews(lang, newsItems);
        
        console.log(`✅ ${newsItems.length} notícias carregadas e cacheadas`);
        return newsItems;
    }

    // ============================================
    // 10. RESOLVER CAMINHO DE IMAGEM
    // ============================================
    function resolveImagePath(imageFilename, basePath) {
        return `${basePath}assets/news/${imageFilename}`;
    }

    // ============================================
    // 11. EXPOR MÓDULO GLOBAL
    // ============================================
    window.NewsShared = {
        CATEGORY_COLORS: CATEGORY_COLORS,
        getText: getText,
        formatDate: formatDate,
        parseFilename: parseFilename,
        extractMetadata: extractMetadata,
        processMarkdown: processMarkdown,
        renderMarkdownToHtml: renderMarkdownToHtml,
        extractContentByLang: extractContentByLang,
        loadNewsData: loadNewsData,
        resolveImagePath: resolveImagePath
    };

    console.log('📦 news-shared.js carregado');

})();
