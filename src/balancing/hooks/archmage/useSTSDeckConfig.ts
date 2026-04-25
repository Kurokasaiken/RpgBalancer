/**
 * Hook for managing STS Deck Configuration
 * 
 * Provides access to deck presets and handles deck selection for the STS simulator.
 * All data is config-first and loaded from the archmage configuration modules.
 */

import { useMemo } from 'react';
import type { STSDeckPreset } from '../../config/archmage';
import { DEFAULT_DECKS } from '../../config/archmage';

/**
 * Hook for accessing STS deck configurations
 * 
 * @param deckId - Optional specific deck ID to load
 * @returns Deck configuration and available decks
 */
export function useSTSDeckConfig(deckId?: string) {
  const decks = useMemo(() => DEFAULT_DECKS, []);
  
  const selectedDeck = useMemo(() => {
    if (!deckId) return null;
    return decks[deckId] || null;
  }, [deckId, decks]);

  const deckOptions = useMemo(() => {
    return Object.values(decks).map(deck => ({
      id: deck.id,
      label: deck.label,
      description: `${deck.cards.length} cards, HP: ${deck.basePlayerHp}`,
      handSize: deck.handSize,
      cardCount: deck.cards.length
    }));
  }, [decks]);

  return {
    // Selected deck
    deck: selectedDeck,
    
    // All available decks
    decks,
    deckOptions,
    
    // Convenience getters
    availableDeckIds: Object.keys(decks),
    hasDeck: !!selectedDeck,
    
    // Deck validation
    isValidDeckId: (id: string) => id in decks,
    
    // Default deck
    defaultDeckId: 'starter_deck'
  };
}

/**
 * Hook for getting deck cards with computed properties
 * 
 * @param deck - Deck configuration
 * @returns Enhanced card information
 */
export function useSTSCards(deck: STSDeckPreset | null) {
  const cards = useMemo(() => {
    if (!deck) return [];
    
    return deck.cards.map((card, index) => ({
      ...card,
      index,
      totalManaCost: Object.values(card.manaCost).reduce((sum, cost) => sum + cost, 0),
      hasRebellionTimer: card.rebellionTimer > 0,
      isBasic: card.tags?.includes('basic') || false,
      manaTypes: Object.keys(card.manaCost) as Array<keyof typeof card.manaCost>
    }));
  }, [deck]);

  const cardsByManaCost = useMemo(() => {
    return cards.reduce((acc, card) => {
      const cost = card.totalManaCost;
      if (!acc[cost]) acc[cost] = [];
      acc[cost].push(card);
      return acc;
    }, {} as Record<number, typeof cards>);
  }, [cards]);

  const cardsByType = useMemo(() => {
    return cards.reduce((acc, card) => {
      const type = card.effect.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(card);
      return acc;
    }, {} as Record<string, typeof cards>);
  }, [cards]);

  return {
    cards,
    cardsByManaCost,
    cardsByType,
    cardCount: cards.length,
    
    // Card filters
    getCardsByManaCost: (cost: number) => cardsByManaCost[cost] || [],
    getCardsByType: (type: string) => cardsByType[type] || [],
    
    // Card search
    findCard: (cardId: string) => cards.find(card => card.id === cardId),
    
    // Mana analysis
    averageManaCost: cards.length > 0 
      ? cards.reduce((sum, card) => sum + card.totalManaCost, 0) / cards.length 
      : 0,
    manaCostRange: {
      min: Math.min(...cards.map(card => card.totalManaCost)),
      max: Math.max(...cards.map(card => card.totalManaCost))
    }
  };
}
