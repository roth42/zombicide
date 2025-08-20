// Session management
const SESSION_KEY = 'zombicide-session';

function saveSession() {
    const spawnPoints = Array.from(document.querySelectorAll('.spawn-point')).map(sp => ({
        id: sp.id,
        title: sp.querySelector('.spawn-title').textContent,
        cardId: sp.dataset.cardId || null
    }));
    
    const session = {
        heroLevel: getCurrentHeroLevel(),
        wolfzEnabled: isWolfzEnabled(),
        spawnPoints: spawnPoints,
        spawnPointCounter: spawnPointCounter
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession() {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    
    try {
        return JSON.parse(saved);
    } catch (error) {
        console.warn('Failed to parse saved session:', error);
        return null;
    }
}

function resetSession() {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
}

// Function to get current selected hero level
function getCurrentHeroLevel() {
    const selector = document.getElementById('hero-level');
    return selector ? parseInt(selector.value) : 1;
}

// Function to check if Wolfz is enabled
function isWolfzEnabled() {
    const wolfzToggle = document.getElementById('wolfz-enabled');
    return wolfzToggle ? wolfzToggle.checked : true;
}

// Global spawn point counter
let spawnPointCounter = 3;

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


    // Function to get emoji for extra activation zombie types
    function getZombieEmojiForActivation(zombieType) {
        switch (zombieType.toLowerCase()) {
            case 'walkers':
                return '🧟';
            case 'fatties':
                return '🧟‍♂️';
            case 'runners':
                return '🏃‍♀️';
            case 'abomination':
            case 'abomination"': // Handle potential quote in data
                return '👹';
            case 'no one':
                return '❌';
            default:
                return '🔄';
        }
    }

    // Function to create card display HTML
    function createCardDisplay(card) {
        if (!card) {
            return '<div class="card-loading">No card data available</div>';
        }

        const levelClass = card.levelName.toLowerCase();
        const zombieTypes = ZombicideCards.metadata.zombieTypes;
        
        let zombiesHTML = '';

        // Check each zombie type
        zombieTypes.forEach(type => {
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
        }

        // Special effects
        let specialHTML = '';
        // Note: specialAbomination and specialNecromancer are not displayed to users
        // They are used internally for card categorization only
        if (card.doubleSpawn) {
            specialHTML += `<div class="card-special">⚡ Double Spawn</div>`;
        }
        if (card.extraActivation) {
            const zombieType = card.extraActivation;
            const emoji = getZombieEmojiForActivation(zombieType);
            specialHTML += `<div class="card-special">🔄 Extra Activation: ${emoji} ${zombieType}</div>`;
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

    
    // Function to set hero level
    function setHeroLevel(level) {
        const selector = document.getElementById('hero-level');
        if (selector) {
            selector.value = level;
        }
    }
    
    // Function to set Wolfz enabled state
    function setWolfzEnabled(enabled) {
        const wolfzToggle = document.getElementById('wolfz-enabled');
        if (wolfzToggle) {
            wolfzToggle.checked = enabled;
        }
    }

    // Function to get available cards based on level and Wolfz setting
    function getAvailableCards(level) {
        if (!ZombicideCards.cards || ZombicideCards.cards.length === 0) {
            return [];
        }

        // Get cards for the selected level
        let availableCards = ZombicideCards.cards.filter(card => card.level === level);

        // Filter by expansion based on Wolfz setting
        if (isWolfzEnabled()) {
            // Include base game and wolfz expansion cards
            availableCards = availableCards.filter(card => 
                card.expansion === 'base' || card.expansion === 'wolfz'
            );
        } else {
            // Include only base game cards
            availableCards = availableCards.filter(card => 
                card.expansion === 'base'
            );
        }

        return availableCards;
    }

    // Function to update zombie display based on card data
    function updateZombieDisplay(spawnPointElement, card) {
        const zombieMob = spawnPointElement.querySelector('.zombie-mob');
        if (!zombieMob || !card) return;
        
        let zombieHTML = '';
        
        // Show actual zombies from the card
        if (card.walker > 0) {
            for (let i = 0; i < card.walker; i++) {
                zombieHTML += '<div class="zombie" title="Walker">🧟</div>';
            }
        }
        if (card.fatty > 0) {
            for (let i = 0; i < card.fatty; i++) {
                zombieHTML += '<div class="zombie" title="Fatty">🧟‍♂️</div>';
            }
        }
        if (card.runner > 0) {
            for (let i = 0; i < card.runner; i++) {
                zombieHTML += '<div class="zombie" title="Runner">🏃‍♀️</div>';
            }
        }
        if (card.abomination > 0) {
            for (let i = 0; i < card.abomination; i++) {
                zombieHTML += '<div class="zombie" title="Abomination">👹</div>';
            }
        }
        if (card.wolfz > 0) {
            for (let i = 0; i < card.wolfz; i++) {
                zombieHTML += '<div class="zombie" title="Wolfz">🐺</div>';
            }
        }
        if (card.wolfbomination > 0) {
            for (let i = 0; i < card.wolfbomination; i++) {
                zombieHTML += '<div class="zombie" title="Wolfbomination">🐺👹</div>';
            }
        }
        if (card.necromancer > 0) {
            for (let i = 0; i < card.necromancer; i++) {
                zombieHTML += '<div class="zombie" title="Necromancer">🧙‍♂️</div>';
            }
        }
        if (card.deadeyeWalkers > 0) {
            for (let i = 0; i < card.deadeyeWalkers; i++) {
                zombieHTML += '<div class="zombie" title="Deadeye Walkers">🎯🧟</div>';
            }
        }
        if (card.murderOfCrowz > 0) {
            for (let i = 0; i < card.murderOfCrowz; i++) {
                zombieHTML += '<div class="zombie" title="Murder of Crowz">🐦‍⬛</div>';
            }
        }
        if (card.npc > 0) {
            for (let i = 0; i < card.npc; i++) {
                zombieHTML += '<div class="zombie" title="NPC">👤</div>';
            }
        }
        
        // Handle nothing cards
        if (card.nothing > 0) {
            zombieHTML = '<div class="zombie" title="Nothing spawns">❌</div>';
        }
        
        // If no zombies, show empty state
        if (!zombieHTML) {
            zombieHTML = '<div class="zombie" title="No zombies">⭕</div>';
        }
        
        zombieMob.innerHTML = zombieHTML;
    }
    
    // Function to assign a specific card by ID to a spawn point
    function assignSpecificCard(spawnPointElement, cardId) {
        const cardInfo = spawnPointElement.querySelector('.card-info');
        
        if (!cardsLoaded || !ZombicideCards.cards || ZombicideCards.cards.length === 0) {
            cardInfo.innerHTML = '<div class="card-loading">Cards not loaded</div>';
            return;
        }
        
        const card = ZombicideCards.cards.find(c => c.id == cardId);
        if (card) {
            cardInfo.innerHTML = createCardDisplay(card);
            spawnPointElement.dataset.cardId = card.id;
            updateZombieDisplay(spawnPointElement, card);
        } else {
            // Fallback to random card if specific card not found
            assignRandomCard(spawnPointElement);
        }
    }
    
    // Function to assign a random card to a spawn point
    function assignRandomCard(spawnPointElement) {
        const cardInfo = spawnPointElement.querySelector('.card-info');
        
        if (!cardsLoaded || !ZombicideCards.cards || ZombicideCards.cards.length === 0) {
            cardInfo.innerHTML = '<div class="card-loading">Cards not loaded</div>';
            return;
        }

        // Use the selected hero level and Wolfz setting
        const level = getCurrentHeroLevel();
        const availableCards = getAvailableCards(level);

        if (availableCards.length > 0) {
            // Get random card from available cards
            const randomIndex = Math.floor(Math.random() * availableCards.length);
            const card = availableCards[randomIndex];
            
            cardInfo.innerHTML = createCardDisplay(card);
            // Store card data on the element for future reference
            spawnPointElement.dataset.cardId = card.id;
            
            // Update zombie display to match the card
            updateZombieDisplay(spawnPointElement, card);
            
            // Save session after assigning card
            setTimeout(() => saveSession(), 100);
        } else {
            cardInfo.innerHTML = '<div class="card-loading">No cards available for current settings</div>';
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

    function addSpawnPoint(title = null, cardId = null) {
        spawnPointCounter++;
        const container = document.querySelector('.spawn-points-container');
        const addButton = document.querySelector('.add-spawn-container');
        const newSpawnId = `spawn-${spawnPointCounter}`;
        
        const spawnTitle = title || `Spawn Point ${spawnPointCounter}`;
        
        const spawnPointHTML = `
            <div class="spawn-point" id="${newSpawnId}" draggable="true">
                <div class="drag-handle">⋮⋮</div>
                <button class="remove-spawn-btn" onclick="removeSpawnPoint('${newSpawnId}')">×</button>
                <h3 class="spawn-title" onclick="editTitle(this)" data-original="${spawnTitle}">${spawnTitle}</h3>
                <div class="zombie-mob">
                    <div class="zombie" title="Loading...">⏳</div>
                </div>
                <div class="card-info">
                    <div class="card-loading">Drawing card...</div>
                </div>
            </div>
        `;
        
        const newElement = document.createRange().createContextualFragment(spawnPointHTML).firstElementChild;
        container.insertBefore(newElement, addButton);
        
        setupDragAndDrop(newElement);
        
        // Assign a card to the new spawn point (either saved or random)
        setTimeout(() => {
            if (cardId) {
                assignSpecificCard(newElement, cardId);
            } else {
                assignRandomCard(newElement);
            }
        }, 100);
        
        // Save session after adding spawn point
        setTimeout(() => saveSession(), 200);
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

    document.getElementById('add-spawn-btn').addEventListener('click', function() {
        addSpawnPoint();
    });
    
    // Add event listener for spawn all button
    document.getElementById('spawn-all-btn').addEventListener('click', function() {
        console.log('Spawning new cards for all spawn points');
        refreshAllCards();
    });
    
    // Add event listener for reset session button
    document.getElementById('reset-session-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the session? This will clear all spawn points and settings.')) {
            resetSession();
        }
    });
    
    // Add event listener for hero level changes
    document.getElementById('hero-level').addEventListener('change', function() {
        console.log('Hero level changed to:', this.value);
        refreshAllCards();
        saveSession();
    });

    // Add event listener for Wolfz toggle changes
    document.getElementById('wolfz-enabled').addEventListener('change', function() {
        console.log('Wolfz expansion', this.checked ? 'enabled' : 'disabled');
        refreshAllCards();
        saveSession();
    });
    
    setupAllDragAndDrop();
    
    // Load saved session or initialize default
    const savedSession = loadSession();
    if (savedSession) {
        // Restore session data immediately (regardless of cards loaded status)
        setHeroLevel(savedSession.heroLevel);
        setWolfzEnabled(savedSession.wolfzEnabled);
        spawnPointCounter = savedSession.spawnPointCounter || 3;
        
        // Remove existing spawn points (except the ones we want to restore)
        const container = document.querySelector('.spawn-points-container');
        const existingSpawnPoints = container.querySelectorAll('.spawn-point');
        existingSpawnPoints.forEach(sp => sp.remove());
        
        // Restore spawn points from session
        if (savedSession.spawnPoints && savedSession.spawnPoints.length > 0) {
            savedSession.spawnPoints.forEach((spData) => {
                // Create spawn point with restored data
                
                const spawnPointHTML = `
                    <div class="spawn-point" id="${spData.id}" draggable="true">
                        <div class="drag-handle">⋮⋮</div>
                        <button class="remove-spawn-btn" onclick="removeSpawnPoint('${spData.id}')">×</button>
                        <h3 class="spawn-title" onclick="editTitle(this)" data-original="${spData.title}">${spData.title}</h3>
                        <div class="zombie-mob">
                            <div class="zombie" title="Loading...">⏳</div>
                        </div>
                        <div class="card-info">
                            <div class="card-loading">Loading saved card...</div>
                        </div>
                    </div>
                `;
                
                const addButton = container.querySelector('.add-spawn-container');
                const newElement = document.createRange().createContextualFragment(spawnPointHTML).firstElementChild;
                container.insertBefore(newElement, addButton);
                
                setupDragAndDrop(newElement);
                
                // Restore the specific card when cards are loaded
                if (cardsLoaded) {
                    setTimeout(() => {
                        if (spData.cardId) {
                            assignSpecificCard(newElement, spData.cardId);
                        } else {
                            assignRandomCard(newElement);
                        }
                    }, Math.random() * 300 + 100);
                } else {
                    // Wait for cards to load, then restore
                    const waitForCards = setInterval(() => {
                        if (ZombicideCards.cards && ZombicideCards.cards.length > 0) {
                            clearInterval(waitForCards);
                            if (spData.cardId) {
                                assignSpecificCard(newElement, spData.cardId);
                            } else {
                                assignRandomCard(newElement);
                            }
                        }
                    }, 100);
                }
            });
        } else {
            // No saved spawn points, initialize default ones
            initializeDefaultSpawnPoints();
        }
    } else {
        // No saved session, initialize default spawn points
        initializeDefaultSpawnPoints();
    }
    
    function initializeDefaultSpawnPoints() {
        const existingSpawnPoints = document.querySelectorAll('.spawn-point');
        existingSpawnPoints.forEach(spawnPoint => {
            if (cardsLoaded) {
                setTimeout(() => assignRandomCard(spawnPoint), Math.random() * 500 + 100);
            } else {
                // Wait for cards to load
                const waitForCards = setInterval(() => {
                    if (ZombicideCards.cards && ZombicideCards.cards.length > 0) {
                        clearInterval(waitForCards);
                        assignRandomCard(spawnPoint);
                    }
                }, 100);
            }
        });
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