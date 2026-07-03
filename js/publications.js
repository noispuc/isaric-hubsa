(function() {
    'use strict';

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterYear = document.getElementById('filter-year');
    const filterDisease = document.getElementById('filter-disease');
    const filterProgram = document.getElementById('filter-program');
    const publicationsList = document.getElementById('publications-list');
    const items = Array.from(publicationsList.querySelectorAll('.publication-item'));

    function filterPublications() {
        const query = searchInput.value.toLowerCase().trim();
        const year = filterYear.value;
        const disease = filterDisease.value;
        const program = filterProgram.value;

        let visibleCount = 0;

        items.forEach(item => {
            const title = item.querySelector('h3')?.textContent?.toLowerCase() || '';
            const authors = item.querySelector('.pub-authors')?.textContent?.toLowerCase() || '';
            const itemYear = item.dataset.year || '';
            const itemDisease = item.dataset.disease || '';
            const itemProgram = item.dataset.program || '';

            const matchSearch = !query || title.includes(query) || authors.includes(query);
            const matchYear = year === 'all' || itemYear === year;
            const matchDisease = disease === 'all' || itemDisease === disease;
            const matchProgram = program === 'all' || itemProgram === program;

            if (matchSearch && matchYear && matchDisease && matchProgram) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Mostra mensagem de "nenhum resultado" se necessário
        let noResults = document.querySelector('.no-results');
        if (visibleCount === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results visible';
                noResults.textContent = 'Nenhuma publicação encontrada.';
                publicationsList.appendChild(noResults);
            } else {
                noResults.classList.add('visible');
            }
        } else if (noResults) {
            noResults.classList.remove('visible');
        }
    }

    // Event listeners
    searchBtn.addEventListener('click', filterPublications);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filterPublications();
        }
    });
    filterYear.addEventListener('change', filterPublications);
    filterDisease.addEventListener('change', filterPublications);
    filterProgram.addEventListener('change', filterPublications);

    // Função de citação (placeholder)
    document.querySelectorAll('.pub-cite').forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Função de citação em desenvolvimento.');
        });
    });

    // Filtro inicial
    filterPublications();

})();