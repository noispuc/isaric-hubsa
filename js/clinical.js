(function() {
    'use strict';

    const projectItems = document.querySelectorAll('.project-item');
    const projectDetails = {
        'aria': document.getElementById('detail-aria'),
        'pocus': document.getElementById('detail-pocus'),
        'mosaic': document.getElementById('detail-mosaic'),
        'chikungunya': document.getElementById('detail-chikungunya')
    };

    function switchProject(projectId) {
        // Remove active class from all items
        projectItems.forEach(item => item.classList.remove('active'));

        // Hide all details
        Object.values(projectDetails).forEach(detail => {
            if (detail) detail.style.display = 'none';
        });

        // Activate selected
        const selectedItem = document.querySelector(`.project-item[data-project="${projectId}"]`);
        if (selectedItem) selectedItem.classList.add('active');

        const selectedDetail = projectDetails[projectId];
        if (selectedDetail) selectedDetail.style.display = 'block';
    }

    projectItems.forEach(item => {
        item.addEventListener('click', function() {
            const project = this.dataset.project;
            if (project) switchProject(project);
        });
    });

})();