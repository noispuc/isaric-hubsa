(function() {
    'use strict';

    const filterType = document.getElementById('filter-type');
    const filterYear = document.getElementById('filter-year');
    const eventsList = document.getElementById('events-list');
    const noEvents = document.getElementById('no-events');
    const items = Array.from(eventsList.querySelectorAll('.event-item'));

    function filterEvents() {
        const type = filterType.value;
        const year = filterYear.value;

        let visibleCount = 0;

        items.forEach(item => {
            const itemType = item.dataset.type || '';
            const itemYear = item.dataset.year || '';

            const matchType = type === 'all' || itemType === type;
            const matchYear = year === 'all' || itemYear === year;

            if (matchType && matchYear) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            noEvents.style.display = 'block';
        } else {
            noEvents.style.display = 'none';
        }
    }

    // Event listeners
    filterType.addEventListener('change', filterEvents);
    filterYear.addEventListener('change', filterEvents);

    // Filtro inicial
    filterEvents();

})();