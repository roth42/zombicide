document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const sections = document.querySelectorAll('section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    function updateActiveNav() {
        const scrollPosition = window.scrollY;
        const headerHeight = document.querySelector('header').offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 50;
            const sectionBottom = sectionTop + section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();

    let spawnPointCounter = 3;

    function addSpawnPoint() {
        spawnPointCounter++;
        const container = document.querySelector('.spawn-points-container');
        const addButton = document.querySelector('.add-spawn-container');
        const newSpawnId = `spawn-${spawnPointCounter}`;
        
        const zombieTypes = ['🧟', '🧟‍♀️', '🧟‍♂️'];
        const zombieCount = Math.floor(Math.random() * 6) + 3;
        let zombieHTML = '';
        
        for (let i = 0; i < zombieCount; i++) {
            const randomZombie = zombieTypes[Math.floor(Math.random() * zombieTypes.length)];
            zombieHTML += `<div class="zombie">${randomZombie}</div>`;
        }
        
        const spawnPointHTML = `
            <div class="spawn-point" id="${newSpawnId}" draggable="true">
                <div class="drag-handle">⋮⋮</div>
                <button class="remove-spawn-btn" onclick="removeSpawnPoint('${newSpawnId}')">×</button>
                <h3 class="spawn-title" onclick="editTitle(this)" data-original="Spawn Point ${spawnPointCounter}">Spawn Point ${spawnPointCounter}</h3>
                <div class="zombie-mob">
                    ${zombieHTML}
                </div>
            </div>
        `;
        
        const newElement = document.createRange().createContextualFragment(spawnPointHTML).firstElementChild;
        container.insertBefore(newElement, addButton);
        
        setupDragAndDrop(newElement);
    }

    function setupDragAndDrop(spawnPoint) {
        spawnPoint.addEventListener('dragstart', handleDragStart);
        spawnPoint.addEventListener('dragend', handleDragEnd);
        spawnPoint.addEventListener('dragover', handleDragOver);
        spawnPoint.addEventListener('dragenter', handleDragEnter);
        spawnPoint.addEventListener('dragleave', handleDragLeave);
        spawnPoint.addEventListener('drop', handleDrop);
    }

    function setupAllDragAndDrop() {
        const spawnPoints = document.querySelectorAll('.spawn-point');
        spawnPoints.forEach(setupDragAndDrop);
    }

    let draggedElement = null;

    function handleDragStart(e) {
        if (e.target.classList.contains('spawn-title') || 
            e.target.classList.contains('remove-spawn-btn') ||
            e.target.classList.contains('spawn-title-input')) {
            e.preventDefault();
            return;
        }
        
        draggedElement = this;
        this.classList.add('dragging');
        document.querySelector('.spawn-points-container').classList.add('drag-active');
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.outerHTML);
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        document.querySelector('.spawn-points-container').classList.remove('drag-active');
        
        const allSpawnPoints = document.querySelectorAll('.spawn-point');
        allSpawnPoints.forEach(point => point.classList.remove('drag-over'));
        
        draggedElement = null;
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter() {
        if (this !== draggedElement) {
            this.classList.add('drag-over');
        }
    }

    function handleDragLeave() {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (draggedElement !== this) {
            const container = document.querySelector('.spawn-points-container');
            
            const draggedIndex = Array.from(container.children).indexOf(draggedElement);
            const targetIndex = Array.from(container.children).indexOf(this);
            
            if (draggedIndex < targetIndex) {
                container.insertBefore(draggedElement, this.nextSibling);
            } else {
                container.insertBefore(draggedElement, this);
            }
        }
        
        this.classList.remove('drag-over');
        return false;
    }

    document.getElementById('add-spawn-btn').addEventListener('click', addSpawnPoint);
    
    setupAllDragAndDrop();

    console.log('Zombicide project initialized successfully!');
});

function removeSpawnPoint(spawnId) {
    const spawnPoint = document.getElementById(spawnId);
    if (spawnPoint) {
        spawnPoint.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => {
            spawnPoint.remove();
        }, 500);
    }
}

function editTitle(titleElement) {
    if (titleElement.querySelector('input')) {
        return;
    }

    const currentText = titleElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'spawn-title-input';
    
    titleElement.style.display = 'none';
    titleElement.parentNode.insertBefore(input, titleElement);
    input.focus();
    input.select();

    function saveTitle() {
        const newTitle = input.value.trim() || titleElement.dataset.original;
        titleElement.textContent = newTitle;
        titleElement.dataset.original = newTitle;
        titleElement.style.display = '';
        input.remove();
    }

    function cancelEdit() {
        titleElement.style.display = '';
        input.remove();
    }

    input.addEventListener('blur', saveTitle);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTitle();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
}