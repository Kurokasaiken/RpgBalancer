# STS Deck Archetype Classifier

## Overview
Config-first deck archetype classification system using rule-based and heuristic approaches with confidence scoring.

## Features
- **13 Predefined Archetypes** across 4 characters
- **Rule-Based Classification** with 7 rule types
- **Confidence Scoring** (0-1 scale)
- **Hybrid Detection** for multi-archetype decks
- **Telemetry Integration** (`sts_deck_classified`)

## Archetypes

### Ironclad
- **Strength Scaling**: Builds strength with Limit Break, Demon Form
- **Exhaust Synergy**: Uses Corruption, Feel No Pain
- **Barricade Block**: Stacks block with Barricade, Body Slam

### Silent
- **Poison**: Applies poison with Catalyst, Noxious Fumes
- **Shiv**: Generates shivs with Blade Dance, Accuracy
- **Discard Synergy**: Uses Tactician, Reflex

### Defect
- **Frost Focus**: Channels frost orbs for block
- **Lightning Focus**: Channels lightning for damage
- **Claw**: Stacks Claw for exponential damage

### Watcher
- **Wrath Stance**: Leverages Wrath for burst damage
- **Divinity**: Enters Divinity for triple damage
- **Scry Synergy**: Uses scry for card manipulation

## Usage

```typescript
import { DeckArchetypeClassifier } from '@/balancing/sts/DeckArchetypeClassifier';

const classifier = new DeckArchetypeClassifier();

const deck = {
  id: 'my-deck',
  character: 'ironclad',
  totalCards: 20,
  avgCost: 1.5,
  cards: [/* ... */],
};

const classification = classifier.classifyDeck(deck);
console.log(classification.primaryArchetype.archetypeName); // "Strength Scaling"
console.log(classification.primaryArchetype.confidence); // 0.85
```

## Rule Types
1. **card_count**: Minimum card count
2. **card_percentage**: Card type percentage
3. **tag_count**: Tag count threshold
4. **tag_percentage**: Tag percentage threshold
5. **cost_threshold**: Average cost range
6. **rarity_distribution**: Rarity percentage
7. **synergy_check**: Custom synergy logic

## Configuration
All archetypes and rules defined in `archetypeClassifierConfig.ts` with Zod validation.
