// ============================================
// RODÍZIO DE NOTÍCIAS (1+4) - A CADA 10 SEGUNDOS
// ============================================
(function() {
    'use strict';

    let indiceAtual = 0;
    let intervalo = null;
    let noticias = [];

    // Função para capturar os dados das 5 notícias (1 principal + 4 thumbnails)
    function capturarNoticias() {
        const principal = document.querySelector('.noticia-principal');
        const thumbnails = document.querySelectorAll('.noticias-thumbnails .thumbnail');

        // Limpa o array
        noticias = [];

        // Adiciona a notícia principal
        if (principal) {
            const img = principal.querySelector('img');
            const titulo = principal.querySelector('h3');
            const resumo = principal.querySelector('p');
            const link = principal.querySelector('a');

            noticias.push({
                imagem: img ? img.src : '',
                alt: img ? img.alt : '',
                titulo: titulo ? titulo.textContent : '',
                resumo: resumo ? resumo.textContent : '',
                link: link ? link.href : '#'
            });
        }

        // Adiciona as 4 thumbnails
        thumbnails.forEach(el => {
            const img = el.querySelector('img');
            const span = el.querySelector('span');
            // Pega o link do atributo data-link ou do onclick
            let link = el.dataset.link;
            if (!link) {
                const onclick = el.getAttribute('onclick');
                if (onclick) {
                    const match = onclick.match(/location\.href='([^']+)'/);
                    if (match) link = match[1];
                }
            }
            if (!link) link = 'pages/learn-more/news.html';

            noticias.push({
                imagem: img ? img.src : '',
                alt: img ? img.alt : '',
                titulo: span ? span.textContent : el.textContent.trim(),
                resumo: '', // thumbnails não têm resumo
                link: link
            });
        });
    }

    // Função para atualizar a notícia principal e reorganizar os thumbnails
    function atualizarNoticias(indice) {
        if (noticias.length < 5) return;

        const principal = document.querySelector('.noticia-principal');
        const thumbnails = document.querySelectorAll('.noticias-thumbnails .thumbnail');

        if (!principal || thumbnails.length < 4) return;

        // --- 1. Atualiza a notícia principal ---
        const noticiaAtual = noticias[indice];
        const img = principal.querySelector('img');
        const titulo = principal.querySelector('h3');
        const resumo = principal.querySelector('p');
        const link = principal.querySelector('a');

        if (img) { img.src = noticiaAtual.imagem; img.alt = noticiaAtual.alt; }
        if (titulo) titulo.textContent = noticiaAtual.titulo;
        if (resumo) resumo.textContent = noticiaAtual.resumo;
        if (link) link.href = noticiaAtual.link;

        // --- 2. Reorganiza os thumbnails (as 4 notícias seguintes) ---
        // Pega as 4 notícias seguintes (circular)
        const thumbnailsData = [];
        for (let i = 1; i <= 4; i++) {
            const idx = (indice + i) % noticias.length;
            thumbnailsData.push(noticias[idx]);
        }

        // Atualiza cada thumbnail
        thumbnails.forEach((el, index) => {
            const data = thumbnailsData[index];
            if (!data) return;

            const img = el.querySelector('img');
            const span = el.querySelector('span');

            if (img) { img.src = data.imagem; img.alt = data.alt; }
            if (span) span.textContent = data.titulo;

            // Atualiza o onclick e data-link
            el.setAttribute('data-link', data.link);
            el.setAttribute('onclick', `location.href='${data.link}'`);
        });
    }

    // Função para avançar para a próxima notícia
    function proximaNoticia() {
        if (noticias.length === 0) return;
        indiceAtual = (indiceAtual + 1) % noticias.length;
        atualizarNoticias(indiceAtual);
    }

    // Função para iniciar o rodízio
    function iniciarRodizio() {
        if (intervalo) {
            clearInterval(intervalo);
        }
        if (noticias.length > 1) {
            intervalo = setInterval(proximaNoticia, 10000);
        }
    }

    // Função para parar o rodízio
    function pararRodizio() {
        if (intervalo) {
            clearInterval(intervalo);
            intervalo = null;
        }
    }

    // Inicializa o rodízio quando a página carregar
    if (document.querySelector('.noticia-principal')) {
        // Captura os dados das notícias
        capturarNoticias();

        // Se houver notícias, inicia o rodízio
        if (noticias.length > 0) {
            atualizarNoticias(0);
            iniciarRodizio();
        }

        // Pausa o rodízio quando o mouse estiver sobre a notícia
        const noticiasContainer = document.querySelector('.noticias-grid');
        if (noticiasContainer) {
            noticiasContainer.addEventListener('mouseenter', pararRodizio);
            noticiasContainer.addEventListener('mouseleave', iniciarRodizio);
        }

        // Pausa o rodízio em dispositivos touch (mobile)
        if ('ontouchstart' in window) {
            noticiasContainer.addEventListener('touchstart', pararRodizio);
            noticiasContainer.addEventListener('touchend', iniciarRodizio);
        }
    }

})();