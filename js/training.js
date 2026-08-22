(function() {
    'use strict';

    const tabs = document.querySelectorAll('.tab-btn');
    const details = {
        'credo': document.getElementById('detail-credo'),
        'fellowship': document.getElementById('detail-fellowship')
    };

    function switchTab(programId) {
        // Remove active class from all tabs
        tabs.forEach(tab => tab.classList.remove('active'));

        // Hide all details
        Object.values(details).forEach(detail => {
            if (detail) detail.style.display = 'none';
        });

        // Activate selected tab
        const selectedTab = document.querySelector(`.tab-btn[data-program="${programId}"]`);
        if (selectedTab) selectedTab.classList.add('active');

        // Show selected detail
        const selectedDetail = details[programId];
        if (selectedDetail) selectedDetail.style.display = 'block';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const program = this.dataset.program;
            if (program) switchTab(program);
        });
    });

})();