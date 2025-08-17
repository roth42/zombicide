document.addEventListener('DOMContentLoaded', async function() {
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

    // Load Zombicide card data
    let cardsLoaded = false;
    try {
        cardsLoaded = await ZombicideCards.loadData();
        console.log('Zombicide cards loaded successfully!');
    } catch (error) {
        console.warn('Could not load Zombicide cards:', error);
    }

    let spawnPointCounter = 3;

    // Function to create card display HTML
    function createCardDisplay(card) {
        if (!card) {
            return '<div class="card-loading">No card data available</div>';
        }

        const levelClass = card.levelName.toLowerCase();
        const zombieTypes = ZombicideCards.metadata.zombieTypes;
        
        let zombiesHTML = '';
        let hasZombies = false;

        // Check each zombie type
        zombieTypes.forEach(type => {
            const fieldName = type.name.toLowerCase().replace(/[^a-z]/g, '');
            let count = 0;
            
            // Map zombie type names to card fields
            switch (type.name) {
                case 'Walker':
                    count = card.walker || 0;
                    break;
                case 'Fatty':
                    count = card.fatty || 0;
                    break;
                case 'Runner':
                    count = card.runner || 0;
                    break;
                case 'Abomination':
                    count = card.abomination || 0;
                    break;
                case 'Wolfz':
                    count = card.wolfz || 0;
                    break;
                case 'Wolfbomination':
                    count = card.wolfbomination || 0;
                    break;
                case 'Deadeye Walkers':
                    count = card.deadeyeWalkers || 0;
                    break;
                case 'Murder of Crowz':
                    count = card.murderOfCrowz || 0;
                    break;
                case 'Necromancer':
                    count = card.necromancer || 0;
                    break;
            }

            if (count > 0) {
                hasZombies = true;
                zombiesHTML += `
                    <div class="zombie-count">
                        <span class="count">${count}</span>
                        <span class="emoji">${type.emoji}</span>
                        <span class="name">${type.name}</span>
                    </div>
                `;
            }
        });

        // Handle "Nothing" cards
        if (card.nothing > 0) {
            zombiesHTML = '<div class="zombie-count"><span class="count">Nothing spawns</span></div>';
            hasZombies = true;
        }

        // Special effects
        let specialHTML = '';
        if (card.specialAbomination) {
            specialHTML += `<div class="card-special">🎯 ${card.specialAbomination}</div>`;
        }
        if (card.specialNecromancer) {
            specialHTML += `<div class="card-special">🔮 ${card.specialNecromancer}</div>`;
        }
        if (card.doubleSpawn) {
            specialHTML += `<div class="card-special">⚡ Double Spawn</div>`;
        }
        if (card.extraActivation) {
            specialHTML += `<div class="card-special">🔄 Extra Activation</div>`;
        }

        return `
            <div class="card-details">
                <div class="card-header">
                    <span class="card-id">Card #${card.id}</span>
                    <span class="card-level ${levelClass}">${card.levelName}</span>
                </div>
                <div class="card-zombies">
                    ${zombiesHTML}
                </div>
                ${specialHTML}
            </div>
        `;
    }

    // Function to get current selected hero level
    function getCurrentHeroLevel() {
        const selector = document.getElementById('hero-level');
        return selector ? parseInt(selector.value) : 1;
    }

    // Function to assign a random card to a spawn point
    function assignRandomCard(spawnPointElement) {
        const cardInfo = spawnPointElement.querySelector('.card-info');
        
        if (!cardsLoaded || !ZombicideCards.cards || ZombicideCards.cards.length === 0) {
            cardInfo.innerHTML = '<div class="card-loading">Cards not loaded</div>';
            return;
        }

        // Use the selected hero level
        const level = getCurrentHeroLevel();

        // Get random card from that level
        const card = ZombicideCards.helpers.getRandomCard(level);
        
        if (card) {
            cardInfo.innerHTML = createCardDisplay(card);
            // Store card data on the element for future reference
            spawnPointElement.dataset.cardId = card.id;
        } else {
            cardInfo.innerHTML = '<div class="card-loading">No cards available for this level</div>';
        }
    }

    // Function to refresh all spawn point cards when level changes
    function refreshAllCards() {
        const spawnPoints = document.querySelectorAll('.spawn-point');
        spawnPoints.forEach(spawnPoint => {
            const cardInfo = spawnPoint.querySelector('.card-info');
            cardInfo.innerHTML = '<div class="card-loading">Drawing new card...</div>';
            setTimeout(() => assignRandomCard(spawnPoint), Math.random() * 300 + 100);
        });
    }

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
                <div class="card-info">
                    <div class="card-loading">Drawing card...</div>
                </div>
            </div>
        `;
        
        const newElement = document.createRange().createContextualFragment(spawnPointHTML).firstElementChild;
        container.insertBefore(newElement, addButton);
        
        setupDragAndDrop(newElement);
        
        // Assign a random card to the new spawn point
        setTimeout(() => assignRandomCard(newElement), 100);
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
    
    // Add event listener for hero level changes
    document.getElementById('hero-level').addEventListener('change', function() {
        console.log('Hero level changed to:', this.value);
        refreshAllCards();
    });
    
    setupAllDragAndDrop();

    // Initialize cards for existing spawn points
    function initializeExistingSpawnPoints() {
        const existingSpawnPoints = document.querySelectorAll('.spawn-point');
        existingSpawnPoints.forEach(spawnPoint => {
            setTimeout(() => assignRandomCard(spawnPoint), Math.random() * 500 + 100);
        });
    }

    // Initialize existing spawn points with cards
    if (cardsLoaded) {
        initializeExistingSpawnPoints();
    } else {
        // If cards aren't loaded yet, try again after a short delay
        setTimeout(() => {
            if (ZombicideCards.cards && ZombicideCards.cards.length > 0) {
                initializeExistingSpawnPoints();
            }
        }, 1000);
    }

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