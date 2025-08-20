const fs = require('fs');

// Read the CSV file
const csvContent = fs.readFileSync('/Users/ronny/projects/personal/zombicide/data/ZombicideSpawnCards.csv', 'utf8');
const lines = csvContent.split('\n');

// Parse header
const header = lines[0].split(';').map(h => h.replace(/"/g, '').trim());

// Create cards array
const cards = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';');
    if (values.length < header.length) continue;
    
    const card = {
        id: parseInt(values[0]) || 0,
        level: parseInt(values[1].match(/\d+/)?.[0]) || 0,
        levelName: values[1].match(/\((.*?)\)/)?.[1] || '',
        nothing: parseInt(values[2]) || 0,
        walker: parseInt(values[3]) || 0,
        fatty: parseInt(values[4]) || 0,
        runner: parseInt(values[5]) || 0,
        abomination: parseInt(values[6]) || 0,
        wolfz: parseInt(values[7]) || 0,
        wolfbomination: parseInt(values[8]) || 0,
        npc: parseInt(values[9]) || 0,
        deadeyeWalkers: parseInt(values[10]) || 0,
        murderOfCrowz: parseInt(values[11]) || 0,
        necromancer: parseInt(values[12]) || 0,
        doubleSpawn: (values[13] && values[13].trim() !== '') ? values[13].trim() : null,
        extraActivation: (values[14] && values[14].trim() !== '') ? values[14].trim().replace(/"/g, '') : null,
        specialNecromancer: (values[15] && values[15].trim() !== '') ? values[15].trim() : null,
        specialAbomination: (values[16] && values[16].trim() !== '') ? values[16].trim() : null
    };
    
    // Determine expansion based on zombie types
    function determineExpansion(card) {
        // Check for wolfz expansion cards
        if (card.wolfz > 0 || card.wolfbomination > 0) {
            return 'wolfz';
        }
        
        // Check for base game cards (any of the core zombie types, nothing cards, or core game mechanics)
        if (card.walker > 0 || card.fatty > 0 || card.runner > 0 || 
            card.abomination > 0 || card.necromancer > 0 || 
            card.nothing > 0 || card.doubleSpawn || card.extraActivation) {
            return 'base';
        }
        
        // All other cards belong to "other" expansion
        return 'other';
    }
    
    card.expansion = determineExpansion(card);
    
    cards.push(card);
}

// Create the final JSON structure
const zombicideData = {
    metadata: {
        description: "Zombicide spawn cards data converted from CSV",
        totalCards: cards.length,
        levels: [
            { id: 1, name: "Blue", color: "#0066cc", description: "Beginner level" },
            { id: 2, name: "Yellow", color: "#ffcc00", description: "Intermediate level" },
            { id: 3, name: "Orange", color: "#ff6600", description: "Advanced level" },
            { id: 4, name: "Red", color: "#cc0000", description: "Expert level" }
        ],
        expansions: [
            { id: "base", name: "Base Game", description: "Core Zombicide content (Walker, Fatty, Runner, Abomination, Necromancer, Nothing cards, Double Spawn, Extra Activation)" },
            { id: "wolfz", name: "Wolfz Expansion", description: "Wolf-based zombies (Wolfz, Wolfbomination)" },
            { id: "other", name: "Other Expansions", description: "All other special zombies and effects" }
        ],
        zombieTypes: [
            { name: "Walker", emoji: "🧟", description: "Basic zombie", expansion: "base" },
            { name: "Fatty", emoji: "🧟‍♂️", description: "Armored zombie", expansion: "base" },
            { name: "Runner", emoji: "🏃‍♀️", description: "Fast zombie", expansion: "base" },
            { name: "Abomination", emoji: "👹", description: "Boss zombie", expansion: "base" },
            { name: "Wolfz", emoji: "🐺", description: "Wolf zombie", expansion: "wolfz" },
            { name: "Wolfbomination", emoji: "🐺👹", description: "Wolf abomination", expansion: "wolfz" },
            { name: "NPC", emoji: "👤", description: "Non-player character", expansion: "other" },
            { name: "Deadeye Walkers", emoji: "🎯🧟", description: "Ranged walkers", expansion: "other" },
            { name: "Murder of Crowz", emoji: "🐦‍⬛", description: "Crow zombies", expansion: "other" },
            { name: "Necromancer", emoji: "🧙‍♂️", description: "Spell caster", expansion: "base" }
        ]
    },
    cards: cards,
    stats: {
        cardsByLevel: {
            blue: cards.filter(c => c.level === 1).length,
            yellow: cards.filter(c => c.level === 2).length,
            orange: cards.filter(c => c.level === 3).length,
            red: cards.filter(c => c.level === 4).length
        },
        cardsByExpansion: {
            base: cards.filter(c => c.expansion === 'base').length,
            wolfz: cards.filter(c => c.expansion === 'wolfz').length,
            other: cards.filter(c => c.expansion === 'other').length
        },
        specialCards: {
            doubleSpawn: cards.filter(c => c.doubleSpawn).length,
            extraActivation: cards.filter(c => c.extraActivation).length,
            specialNecromancer: cards.filter(c => c.specialNecromancer).length,
            specialAbomination: cards.filter(c => c.specialAbomination).length
        }
    }
};

// Write the JSON file
fs.writeFileSync('/Users/ronny/projects/personal/zombicide/data/zombicide-spawn-cards.json', JSON.stringify(zombicideData, null, 2));

console.log(`Converted ${cards.length} cards to JSON format`);
console.log('Expansion distribution:');
console.log(`  Base Game: ${zombicideData.stats.cardsByExpansion.base} cards`);
console.log(`  Wolfz Expansion: ${zombicideData.stats.cardsByExpansion.wolfz} cards`);
console.log(`  Other Expansions: ${zombicideData.stats.cardsByExpansion.other} cards`);
console.log(`Output written to: /Users/ronny/projects/personal/zombicide/data/zombicide-spawn-cards.json`);