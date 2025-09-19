// Session management
const SESSION_KEY = 'zombicide-session';
const HISTORY_KEY = 'zombicide-history';
const DECK_STATE_KEY = 'zombicide-deck-state';

// History management
let spawnHistory = [];

// Deck state management - tracks drawn cards to prevent duplicates
let deckState = {
    drawnCards: new Set(),
    currentLevel: null,
    currentWolfzSetting: null
};

function saveSession() {
    const spawnPoints = Array.from(document.querySelectorAll('.spawn-point')).map(sp => ({
        id: sp.id,
        title: sp.querySelector('.spawn-title').textContent,
        cardIds: sp.dataset.cardIds ? JSON.parse(sp.dataset.cardIds) : []
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
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(DECK_STATE_KEY);
    location.reload();
}

// History management functions
function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(spawnHistory));
}

function loadHistory() {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return [];

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.warn('Failed to parse saved history:', error);
        return [];
    }
}

// Generate a unique session ID for each spawn action
let currentSpawnSessionId = null;

function addToHistory(spawnPointTitle, cards, timestamp = null) {
    // If no current session, create a new one
    if (!currentSpawnSessionId) {
        currentSpawnSessionId = Date.now() + Math.random();
    }

    const entry = {
        id: Date.now() + Math.random(),
        spawnPoint: spawnPointTitle,
        cards: cards,
        timestamp: timestamp || new Date().toISOString(),
        heroLevel: getCurrentHeroLevel(),
        wolfzEnabled: isWolfzEnabled(),
        spawnSessionId: currentSpawnSessionId
    };

    spawnHistory.unshift(entry); // Add to beginning

    // Keep only last 500 entries
    if (spawnHistory.length > 500) {
        spawnHistory = spawnHistory.slice(0, 500);
    }

    saveHistory();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const container = document.querySelector('.history-container');
    if (!container) return;

    if (spawnHistory.length === 0) {
        container.innerHTML = '<div class="history-empty">No spawn history yet. Click \'Spawn\' to start tracking draws.</div>';
        return;
    }

    // Group entries by spawn session
    const groupedEntries = [];
    const sessionMap = new Map();

    spawnHistory.forEach(entry => {
        const sessionId = entry.spawnSessionId || entry.id; // Fallback for legacy entries
        if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, []);
            groupedEntries.push(sessionId);
        }
        sessionMap.get(sessionId).push(entry);
    });

    const historyHTML = groupedEntries.map((sessionId, index) => {
        const entries = sessionMap.get(sessionId);
        const roundNumber = groupedEntries.length - index; // Most recent is round 1
        return createGroupedHistoryHTML(entries, roundNumber);
    }).join('');

    container.innerHTML = historyHTML;
}

function createGroupedHistoryHTML(entries, roundNumber) {
    if (!entries || entries.length === 0) return '';

    // Sort entries within the group (newest first within the session)
    const sortedEntries = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Create individual entry lines with bullet points and indentation
    const entryLines = sortedEntries.map(entry => {
        const cardNumbers = entry.cards.map(card =>
            `<span class="card-number" onclick="toggleCardJson('${entry.id}', ${card.id})">#${card.id}</span>`
        ).join(' ');

        return `
            <div class="history-spawn-item">
                <div class="history-spawn-line">
                    <span style="color: #3498db; font-weight: bold; margin-right: 0.5rem;">•</span>${entry.spawnPoint}: ${cardNumbers}
                </div>
                <div class="card-json-panels">
                    ${entry.cards.map(card => createCardJsonPanel(entry.id, card)).join('')}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="history-group" data-session-id="${entries[0].spawnSessionId || entries[0].id}">
            <div class="history-group-header">
                <span class="history-round">Spawn Round ${roundNumber}</span>
            </div>
            <div class="history-group-content">
                ${entryLines}
            </div>
        </div>
    `;
}

function createHistoryEntryHTML(entry) {
    // Legacy function - keeping for compatibility
    const cardNumbers = entry.cards.map(card =>
        `<span class="card-number" onclick="toggleCardJson('${entry.id}', ${card.id})">#${card.id}</span>`
    ).join(' ');

    return `
        <div class="history-entry" data-entry-id="${entry.id}">
            <div class="history-line">
                <span class="history-spawn-point">${entry.spawnPoint}</span>: ${cardNumbers}
            </div>
            <div class="card-json-panels">
                ${entry.cards.map(card => createCardJsonPanel(entry.id, card)).join('')}
            </div>
        </div>
    `;
}

function createCardJsonPanel(entryId, card) {
    return `
        <div class="card-json-panel" id="json-${entryId}-${card.id}" style="display: none;">
            <div class="card-json-header">
                <span>Card #${card.id} JSON Data</span>
                <button class="close-json" onclick="closeCardJson('${entryId}', ${card.id})">×</button>
            </div>
            <pre class="card-json-content">${JSON.stringify(card, null, 2)}</pre>
        </div>
    `;
}


function toggleCardJson(entryId, cardId) {
    // Close all other open JSON panels first
    const allPanels = document.querySelectorAll('.card-json-panel');
    allPanels.forEach(panel => {
        if (panel.id !== `json-${entryId}-${cardId}`) {
            panel.style.display = 'none';
        }
    });

    // Toggle the clicked panel
    const panel = document.getElementById(`json-${entryId}-${cardId}`);
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function closeCardJson(entryId, cardId) {
    const panel = document.getElementById(`json-${entryId}-${cardId}`);
    if (panel) {
        panel.style.display = 'none';
    }
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

    // Function to create multi-card display HTML
    function createMultiCardDisplay(cards) {
        if (!cards || cards.length === 0) {
            return '<div class="card-loading">No cards drawn</div>';
        }

        if (cards.length === 1) {
            return createCardDisplay(cards[0]);
        }

        // Multiple cards - show each card with full details stacked vertically
        let cardsHTML = '';

        cards.forEach((card) => {
            cardsHTML += createCardDisplay(card);
        });

        return `
            <div class="multi-card-display">
                ${cardsHTML}
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

    // Deck state management functions
    function saveDeckState() {
        const deckStateData = {
            drawnCards: Array.from(deckState.drawnCards),
            currentLevel: deckState.currentLevel,
            currentWolfzSetting: deckState.currentWolfzSetting
        };
        localStorage.setItem(DECK_STATE_KEY, JSON.stringify(deckStateData));
    }

    function loadDeckState() {
        const saved = localStorage.getItem(DECK_STATE_KEY);
        if (!saved) return null;

        try {
            const data = JSON.parse(saved);
            return {
                drawnCards: new Set(data.drawnCards || []),
                currentLevel: data.currentLevel,
                currentWolfzSetting: data.currentWolfzSetting
            };
        } catch (error) {
            console.warn('Failed to parse saved deck state:', error);
            return null;
        }
    }

    function resetDeckState() {
        deckState.drawnCards.clear();
        deckState.currentLevel = getCurrentHeroLevel();
        deckState.currentWolfzSetting = isWolfzEnabled();
        saveDeckState();
        console.log('Deck shuffled - all cards available again');
    }

    function checkAndResetDeckIfNeeded() {
        const currentLevel = getCurrentHeroLevel();
        const currentWolfzSetting = isWolfzEnabled();

        // Reset deck if settings changed
        if (deckState.currentLevel !== currentLevel || deckState.currentWolfzSetting !== currentWolfzSetting) {
            console.log('Settings changed, resetting deck');
            resetDeckState();
            return;
        }

        // Check if deck is exhausted
        const availableCards = getAvailableCards(currentLevel);
        const undrawnCards = availableCards.filter(card => !deckState.drawnCards.has(card.id));

        if (undrawnCards.length === 0) {
            console.log('Deck exhausted, shuffling');
            resetDeckState();
        }
    }

    
    // Function to assign specific cards by IDs to a spawn point
    function assignSpecificCards(spawnPointElement, cardIds, addToHistoryFlag = false) {
        const cardInfo = spawnPointElement.querySelector('.card-info');

        if (!cardsLoaded || !ZombicideCards.cards || ZombicideCards.cards.length === 0) {
            cardInfo.innerHTML = '<div class="card-loading">Cards not loaded</div>';
            return;
        }

        const cards = cardIds.map(id => ZombicideCards.cards.find(c => c.id == id)).filter(Boolean);
        if (cards.length > 0) {
            cardInfo.innerHTML = createMultiCardDisplay(cards);
            spawnPointElement.dataset.cardIds = JSON.stringify(cardIds);

            // Add to history if requested
            if (addToHistoryFlag) {
                const spawnPointTitle = spawnPointElement.querySelector('.spawn-title').textContent;
                addToHistory(spawnPointTitle, cards);
            }
        } else {
            // Fallback to random card if specific cards not found
            assignRandomCards(spawnPointElement, 1, addToHistoryFlag);
        }
    }

    // Function to assign a specific card by ID to a spawn point (legacy support)
    function assignSpecificCard(spawnPointElement, cardId) {
        assignSpecificCards(spawnPointElement, [cardId]);
    }
    
    // Function to draw cards from the undrawn deck
    function drawCardsFromDeck(numCards = 1) {
        checkAndResetDeckIfNeeded();

        const level = getCurrentHeroLevel();
        const availableCards = getAvailableCards(level);
        const undrawnCards = availableCards.filter(card => !deckState.drawnCards.has(card.id));

        if (undrawnCards.length === 0) {
            console.warn('No undrawn cards available, this should not happen after checkAndResetDeckIfNeeded');
            return [];
        }

        const drawnCards = [];
        for (let i = 0; i < numCards && undrawnCards.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * undrawnCards.length);
            const card = undrawnCards[randomIndex];
            drawnCards.push(card);

            // Mark card as drawn and remove from undrawn list
            deckState.drawnCards.add(card.id);
            undrawnCards.splice(randomIndex, 1);
        }

        saveDeckState();
        return drawnCards;
    }

    // Function to assign random cards to a spawn point
    function assignRandomCards(spawnPointElement, numCards = 1, addToHistoryFlag = false) {
        const cardInfo = spawnPointElement.querySelector('.card-info');

        if (!cardsLoaded || !ZombicideCards.cards || ZombicideCards.cards.length === 0) {
            cardInfo.innerHTML = '<div class="card-loading">Cards not loaded</div>';
            return [];
        }

        const drawnCards = drawCardsFromDeck(numCards);

        if (drawnCards.length > 0) {
            cardInfo.innerHTML = createMultiCardDisplay(drawnCards);
            // Store card IDs on the element for future reference
            spawnPointElement.dataset.cardIds = JSON.stringify(drawnCards.map(c => c.id));

            // Add to history if requested
            if (addToHistoryFlag) {
                const spawnPointTitle = spawnPointElement.querySelector('.spawn-title').textContent;
                addToHistory(spawnPointTitle, drawnCards);
            }

            // Save session after assigning cards
            setTimeout(() => saveSession(), 100);

            return drawnCards;
        } else {
            cardInfo.innerHTML = '<div class="card-loading">No cards available for current settings</div>';
            return [];
        }
    }

    // Function to assign a random card to a spawn point (legacy support)
    function assignRandomCard(spawnPointElement) {
        return assignRandomCards(spawnPointElement, 1);
    }

    // Function to process Double Spawn chains across all spawn points
    function processDoubleSpawnChains() {
        // Get spawn points in their current visual order (DOM children order)
        const container = document.querySelector('.spawn-points-container');
        const spawnPoints = Array.from(container.children).filter(child => child.classList.contains('spawn-point'));
        if (spawnPoints.length === 0) return;

        // Clear any existing Double Spawn effects
        spawnPoints.forEach(sp => {
            sp.classList.remove('double-spawn-source', 'double-spawn-target', 'double-spawn-nothing');
        });

        // Process each spawn point for Double Spawn effects
        let chainProcessing = true;
        let maxIterations = spawnPoints.length * 3; // Prevent infinite loops
        
        while (chainProcessing && maxIterations > 0) {
            chainProcessing = false;
            maxIterations--;

            for (let i = 0; i < spawnPoints.length; i++) {
                const spawnPoint = spawnPoints[i];
                
                // Skip if this spawn point already processed or affected by Double Spawn
                if (spawnPoint.classList.contains('double-spawn-nothing') || 
                    spawnPoint.classList.contains('double-spawn-source')) {
                    continue;
                }

                // Get cards for this spawn point
                const cardIds = spawnPoint.dataset.cardIds ? JSON.parse(spawnPoint.dataset.cardIds) : [];
                const cards = cardIds.map(id => ZombicideCards.cards.find(c => c.id == id)).filter(Boolean);
                
                // Count Double Spawn cards
                const doubleSpawnCount = cards.filter(card => card.doubleSpawn).length;

                if (doubleSpawnCount > 0) {
                    // Mark this spawn point as spawning nothing due to Double Spawn
                    spawnPoint.classList.add('double-spawn-source');

                    // Find next spawn point (wrapping around)
                    const nextIndex = (i + 1) % spawnPoints.length;
                    const nextSpawnPoint = spawnPoints[nextIndex];

                    // Make the next spawn point draw cards (2 per Double Spawn)
                    const cardsToDrawCount = doubleSpawnCount * 2;
                    drawCardsForDoubleSpawn(nextSpawnPoint, cardsToDrawCount);
                    nextSpawnPoint.classList.add('double-spawn-target');

                    chainProcessing = true;
                    break; // Process one Double Spawn at a time
                }
            }
        }
    }

    // Function to draw cards for a spawn point due to Double Spawn
    function drawCardsForDoubleSpawn(spawnPoint, numCards) {
        const drawnCards = drawCardsFromDeck(numCards);

        if (drawnCards.length === 0) {
            return;
        }

        // Store the cards and update display
        spawnPoint.dataset.cardIds = JSON.stringify(drawnCards.map(c => c.id));

        // Update display with all cards
        const cardInfo = spawnPoint.querySelector('.card-info');
        cardInfo.innerHTML = createMultiCardDisplay(drawnCards);

        // Note: History tracking is now handled in spawnAllWithDoubleSpawnRules after all processing
    }


    // Function to clear all spawn point cards when level changes
    function clearAllCards() {
        const spawnPoints = document.querySelectorAll('.spawn-point');
        spawnPoints.forEach(spawnPoint => {
            const cardInfo = spawnPoint.querySelector('.card-info');
            cardInfo.innerHTML = '<div class="card-loading">Ready to spawn cards</div>';
            // Clear stored card IDs
            spawnPoint.dataset.cardIds = '';
        });
        // Reset deck state when settings change
        resetDeckState();
    }

    // Function to spawn all cards with Double Spawn rules
    function spawnAllWithDoubleSpawnRules() {
        // Reset the spawn session ID for this new spawn action
        currentSpawnSessionId = null;

        // Get spawn points in their current visual order
        const container = document.querySelector('.spawn-points-container');
        const spawnPoints = Array.from(container.children).filter(child => child.classList.contains('spawn-point'));

        // Show loading state for all spawn points
        spawnPoints.forEach(spawnPoint => {
            const cardInfo = spawnPoint.querySelector('.card-info');
            cardInfo.innerHTML = '<div class="card-loading">Drawing new card...</div>';
        });

        // First, assign random cards to all spawn points (WITHOUT history tracking)
        spawnPoints.forEach(spawnPoint => {
            assignRandomCards(spawnPoint, 1, false); // Disable history tracking initially
        });

        // Process Double Spawn chains
        processDoubleSpawnChains();

        // Now add all final results to history (after Double Spawn processing)
        spawnPoints.forEach(spawnPoint => {
            const cardIds = spawnPoint.dataset.cardIds ? JSON.parse(spawnPoint.dataset.cardIds) : [];
            if (cardIds.length > 0) {
                const cards = cardIds.map(id => ZombicideCards.cards.find(c => c.id == id)).filter(Boolean);
                if (cards.length > 0) {
                    const spawnPointTitle = spawnPoint.querySelector('.spawn-title').textContent;
                    addToHistory(spawnPointTitle, cards);
                }
            }
        });

        saveSession();
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
                <div class="card-info">
                    <div class="card-loading">Ready to spawn cards</div>
                </div>
            </div>
        `;
        
        const newElement = document.createRange().createContextualFragment(spawnPointHTML).firstElementChild;
        container.insertBefore(newElement, addButton);
        
        setupDragAndDrop(newElement);
        
        // Set initial state for new spawn point
        setTimeout(() => {
            if (cardId) {
                assignSpecificCard(newElement, cardId);
            } else {
                const cardInfo = newElement.querySelector('.card-info');
                if (cardInfo) {
                    cardInfo.innerHTML = '<div class="card-loading">Ready to spawn cards</div>';
                }
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
        console.log('Spawning new cards for all spawn points with Double Spawn rules');
        spawnAllWithDoubleSpawnRules();
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
        clearAllCards();
        saveSession();
    });

    // Add event listener for Wolfz toggle changes
    document.getElementById('wolfz-enabled').addEventListener('change', function() {
        console.log('Wolfz expansion', this.checked ? 'enabled' : 'disabled');
        resetSession();
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
                        <div class="card-info">
                            <div class="card-loading">Loading saved card...</div>
                        </div>
                    </div>
                `;
                
                const addButton = container.querySelector('.add-spawn-container');
                const newElement = document.createRange().createContextualFragment(spawnPointHTML).firstElementChild;
                container.insertBefore(newElement, addButton);
                
                setupDragAndDrop(newElement);
                
                // Restore the specific cards when cards are loaded
                if (cardsLoaded) {
                    setTimeout(() => {
                        // Try new cardIds format first, fallback to legacy cardId
                        if (spData.cardIds && spData.cardIds.length > 0) {
                            assignSpecificCards(newElement, spData.cardIds);
                        } else if (spData.cardId) {
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
                            // Try new cardIds format first, fallback to legacy cardId
                            if (spData.cardIds && spData.cardIds.length > 0) {
                                assignSpecificCards(newElement, spData.cardIds);
                            } else if (spData.cardId) {
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
            const cardInfo = spawnPoint.querySelector('.card-info');
            if (cardInfo) {
                cardInfo.innerHTML = '<div class="card-loading">Ready to spawn cards</div>';
            }
        });
    }

    // Load and initialize history
    spawnHistory = loadHistory();
    updateHistoryDisplay();

    // Load and initialize deck state
    const savedDeckState = loadDeckState();
    if (savedDeckState) {
        deckState = savedDeckState;
    } else {
        // Initialize new deck state
        resetDeckState();
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