// Zombicide Spawn Cards Data
// This file contains all spawn card data in a JavaScript-friendly format

const ZombicideCards = {
  // Helper functions for working with cards
  helpers: {
    // Get all cards for a specific level
    getCardsByLevel(level) {
      return ZombicideCards.cards.filter(card => card.level === level);
    },

    // Get a random card from a specific level
    getRandomCard(level) {
      const levelCards = this.getCardsByLevel(level);
      return levelCards[Math.floor(Math.random() * levelCards.length)];
    },

    // Calculate total zombie count for a card
    getTotalZombies(card) {
      return card.walker + card.fatty + card.runner + card.abomination + 
             card.wolfz + card.wolfbomination + card.deadeyeWalkers + card.murderOfCrowz;
    },

    // Get level info by level number
    getLevelInfo(level) {
      return ZombicideCards.metadata.levels.find(l => l.id === level);
    },

    // Draw multiple cards
    drawCards(level, count = 1) {
      const cards = [];
      for (let i = 0; i < count; i++) {
        cards.push(this.getRandomCard(level));
      }
      return cards;
    },

    // Get cards with specific zombie types
    getCardsWithZombieType(level, zombieType) {
      return this.getCardsByLevel(level).filter(card => card[zombieType] > 0);
    },

    // Get special cards
    getSpecialCards(level) {
      return this.getCardsByLevel(level).filter(card => 
        card.specialNecromancer || card.specialAbomination || 
        card.doubleSpawn || card.extraActivation
      );
    }
  },

  // Load the data from JSON file
  async loadData() {
    try {
      const response = await fetch('./data/zombicide-spawn-cards.json');
      const data = await response.json();
      
      // Copy data to this object
      this.metadata = data.metadata;
      this.cards = data.cards;
      this.stats = data.stats;
      
      return true;
    } catch (error) {
      console.error('Failed to load Zombicide cards data:', error);
      return false;
    }
  },

  // Initialize with placeholder data (will be replaced when loadData is called)
  metadata: {
    description: "Zombicide spawn cards data",
    levels: [
      { id: 1, name: "Blue", color: "#0066cc", description: "Beginner level" },
      { id: 2, name: "Yellow", color: "#ffcc00", description: "Intermediate level" },
      { id: 3, name: "Orange", color: "#ff6600", description: "Advanced level" },
      { id: 4, name: "Red", color: "#cc0000", description: "Expert level" }
    ],
    zombieTypes: [
      { name: "Walker", emoji: "🧟", description: "Basic zombie" },
      { name: "Fatty", emoji: "💪", description: "Armored zombie" },
      { name: "Runner", emoji: "🏃‍♀️", description: "Fast zombie" },
      { name: "Abomination", emoji: "👹", description: "Boss zombie" },
      { name: "Wolfz", emoji: "🐺", description: "Wolf zombie" },
      { name: "Wolfbomination", emoji: "🐺👹", description: "Wolf abomination" },
      { name: "NPC", emoji: "👤", description: "Non-player character" },
      { name: "Deadeye Walkers", emoji: "🎯🧟", description: "Ranged walkers" },
      { name: "Murder of Crowz", emoji: "🐦‍⬛", description: "Crow zombies" },
      { name: "Necromancer", emoji: "🧙‍♂️", description: "Spell caster" }
    ]
  },

  cards: [], // Will be populated by loadData()
  stats: {}  // Will be populated by loadData()
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZombicideCards;
}

// Also make available globally
if (typeof window !== 'undefined') {
  window.ZombicideCards = ZombicideCards;
}