/**
 * Punch Club Sponsor System Configuration
 * 
 * Config-first definition of sponsors, offers, contracts, and rewards
 * 
 * @see NP-243 – Sponsor System
 */

import type { 
  SponsorSystemConfig, 
  Sponsor, 
  SponsorOffer, 
  SponsorContract, 
  SponsorTier,
  SponsorCategory,
  SponsorRequirement,
  SponsorReward,
  SponsorBenefit 
} from './sponsorSystem';

// ============================================================================
// SPONSOR TEMPLATES
// ============================================================================

const SPONSOR_TEMPLATES: Sponsor[] = [
  // Elite Tier Sponsors
  {
    id: 'red_bull_energy',
    name: 'Red Bull Energy',
    category: 'sports',
    tier: 'elite',
    description: 'Global energy drink company specializing in extreme sports sponsorships',
    logo: '🔴',
    reputation: 95,
    requirements: [
      { type: 'level', value: 10 },
      { type: 'reputation', value: 80 },
      { type: 'completed_contracts', value: 5 },
    ],
    benefits: [
      {
        id: 'red_bull_bonus',
        type: 'energy_boost',
        name: 'Energy Boost',
        description: '+20% stamina recovery speed',
        value: 20,
        requirement: 2,
      },
      {
        id: 'red_bull_visibility',
        type: 'brand_visibility',
        name: 'Brand Visibility',
        description: '+15% reputation gain',
        value: 15,
        requirement: 3,
      },
    ],
    negotiationDifficulty: 0.8,
    contractFrequency: 0.3,
    rewardMultiplier: 1.5,
  },
  {
    id: 'nike_fighting',
    name: 'Nike Fighting',
    category: 'equipment',
    tier: 'elite',
    description: 'Premium sports equipment manufacturer for combat sports',
    logo: '👟',
    reputation: 90,
    requirements: [
      { type: 'level', value: 12 },
      { type: 'reputation', value: 75 },
      { type: 'completed_contracts', value: 8 },
    ],
    benefits: [
      {
        id: 'nike_gear',
        type: 'equipment_bonus',
        name: 'Premium Gear',
        description: '+25% equipment effectiveness',
        value: 25,
        requirement: 2,
      },
      {
        id: 'nike_training',
        type: 'training_bonus',
        name: 'Training Bonus',
        description: '+10% skill progression',
        value: 10,
        requirement: 3,
      },
    ],
    negotiationDifficulty: 0.7,
    contractFrequency: 0.25,
    rewardMultiplier: 1.4,
  },

  // Premium Tier Sponsors
  {
    id: 'gatorade_sports',
    name: 'Gatorade Sports',
    category: 'nutrition',
    tier: 'premium',
    description: 'Sports nutrition and hydration products',
    logo: '🧃',
    reputation: 80,
    requirements: [
      { type: 'level', value: 8 },
      { type: 'reputation', value: 60 },
      { type: 'completed_contracts', value: 3 },
    ],
    benefits: [
      {
        id: 'gatorade_hydration',
        type: 'hydration_bonus',
        name: 'Hydration Bonus',
        description: '+15% recovery speed',
        value: 15,
        requirement: 2,
      },
    ],
    negotiationDifficulty: 0.6,
    contractFrequency: 0.4,
    rewardMultiplier: 1.3,
  },
  {
    id: 'everlast_boxing',
    name: 'Everlast Boxing',
    category: 'equipment',
    tier: 'premium',
    description: 'Traditional boxing equipment and apparel',
    logo: '🥊',
    reputation: 75,
    requirements: [
      { type: 'level', value: 7 },
      { type: 'reputation', value: 55 },
      { type: 'completed_contracts', value: 4 },
    ],
    benefits: [
      {
        id: 'everlast_durability',
        type: 'equipment_durability',
        name: 'Durability Bonus',
        description: '+20% equipment durability',
        value: 20,
        requirement: 2,
      },
    ],
    negotiationDifficulty: 0.5,
    contractFrequency: 0.35,
    rewardMultiplier: 1.25,
  },

  // Standard Tier Sponsors
  {
    id: 'local_gym',
    name: 'Local Gym',
    category: 'sports',
    tier: 'standard',
    description: 'Neighborhood fitness center and training facility',
    logo: '🏋️',
    reputation: 60,
    requirements: [
      { type: 'level', value: 5 },
      { type: 'reputation', value: 40 },
    ],
    benefits: [
      {
        id: 'gym_access',
        type: 'training_access',
        name: 'Free Gym Access',
        description: 'Free training facility access',
        value: 100,
        requirement: 1,
      },
    ],
    negotiationDifficulty: 0.4,
    contractFrequency: 0.6,
    rewardMultiplier: 1.1,
  },
  {
    id: 'sports_drink_co',
    name: 'Sports Drink Co',
    category: 'nutrition',
    tier: 'standard',
    description: 'Regional sports beverage company',
    logo: '🥤',
    reputation: 55,
    requirements: [
      { type: 'level', value: 4 },
      { type: 'reputation', value: 35 },
    ],
    benefits: [
      {
        id: 'drink_samples',
        type: 'free_samples',
        name: 'Free Samples',
        description: 'Weekly free product samples',
        value: 50,
        requirement: 1,
      },
    ],
    negotiationDifficulty: 0.3,
    contractFrequency: 0.5,
    rewardMultiplier: 1.0,
  },

  // Local Tier Sponsors
  {
    id: 'corner_store',
    name: 'Corner Store',
    category: 'retail',
    tier: 'local',
    description: 'Local convenience store chain',
    logo: '🏪',
    reputation: 40,
    requirements: [
      { type: 'level', value: 2 },
      { type: 'reputation', value: 20 },
    ],
    benefits: [
      {
        id: 'store_discount',
        type: 'discount',
        name: 'Store Discount',
        description: '10% discount on all purchases',
        value: 10,
        requirement: 1,
      },
    ],
    negotiationDifficulty: 0.2,
    contractFrequency: 0.8,
    rewardMultiplier: 0.9,
  },
  {
    id: 'family_restaurant',
    name: 'Family Restaurant',
    category: 'food',
    tier: 'local',
    description: 'Local family-owned restaurant',
    logo: '🍽️',
    reputation: 35,
    requirements: [
      { type: 'level', value: 1 },
      { type: 'reputation', value: 15 },
    ],
    benefits: [
      {
        id: 'free_meals',
        type: 'food_bonus',
        name: 'Free Meals',
        description: '2 free meals per week',
        value: 30,
        requirement: 1,
      },
    ],
    negotiationDifficulty: 0.1,
    contractFrequency: 0.7,
    rewardMultiplier: 0.8,
  },
];

// ============================================================================
// OFFER TEMPLATES
// ============================================================================

const OFFER_TEMPLATES: SponsorOffer[] = [
  // Elite Offers
  {
    id: 'red_bull_championship',
    sponsorId: 'red_bull_energy',
    type: 'championship',
    title: 'Red Bull Championship Sponsorship',
    description: 'Sponsor your championship run with Red Bull energy drinks',
    duration: 30, // 30 days
    requirements: [
      { type: 'level', value: 10 },
      { type: 'reputation', value: 80 },
      { type: 'completed_contracts', value: 5 },
    ],
    rewards: [
      { type: 'money', value: 5000, description: 'Championship bonus' },
      { type: 'energy_boost', value: 25, description: 'Energy boost bonus' },
      { type: 'reputation', value: 15, description: 'Reputation boost' },
    ],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    negotiable: true,
    difficulty: 'hard',
  },
  {
    id: 'nike_exclusive',
    sponsorId: 'nike_fighting',
    type: 'exclusive',
    title: 'Nike Exclusive Gear Contract',
    description: 'Exclusive contract for Nike fighting equipment',
    duration: 45,
    requirements: [
      { type: 'level', value: 12 },
      { type: 'reputation', value: 75 },
      { type: 'active_contracts', value: 1 }, // Max 1 other active contract
    ],
    rewards: [
      { type: 'money', value: 4000, description: 'Base payment' },
      { type: 'equipment', value: 2000, description: 'Premium equipment package' },
      { type: 'training_bonus', value: 10, description: 'Training acceleration' },
    ],
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    negotiable: true,
    difficulty: 'hard',
  },

  // Premium Offers
  {
    id: 'gatorade_hydration',
    sponsorId: 'gatorade_sports',
    type: 'endorsement',
    title: 'Gatorade Hydration Endorsement',
    description: 'Endorse Gatorade sports drinks in your training',
    duration: 21,
    requirements: [
      { type: 'level', value: 8 },
      { type: 'reputation', value: 60 },
      { type: 'stat', stat: 'vitality', value: 50 },
    ],
    rewards: [
      { type: 'money', value: 2500, description: 'Endorsement fee' },
      { type: 'recovery_bonus', value: 20, description: 'Enhanced recovery' },
      { type: 'free_products', value: 100, description: 'Free product supply' },
    ],
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    negotiable: true,
    difficulty: 'medium',
  },
  {
    id: 'everlast_training',
    sponsorId: 'everlast_boxing',
    type: 'training',
    title: 'Everlast Training Partnership',
    description: 'Partner with Everlast for training equipment',
    duration: 28,
    requirements: [
      { type: 'level', value: 7 },
      { type: 'reputation', value: 55 },
      { type: 'completed_contracts', value: 3 },
    ],
    rewards: [
      { type: 'money', value: 2000, description: 'Training stipend' },
      { type: 'equipment_bonus', value: 15, description: 'Equipment effectiveness' },
      { type: 'durability_bonus', value: 25, description: 'Equipment durability' },
    ],
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    negotiable: true,
    difficulty: 'medium',
  },

  // Standard Offers
  {
    id: 'local_gym_sponsorship',
    sponsorId: 'local_gym',
    type: 'facility',
    title: 'Local Gym Sponsorship',
    description: 'Represent your local gym in competitions',
    duration: 14,
    requirements: [
      { type: 'level', value: 5 },
      { type: 'reputation', value: 40 },
    ],
    rewards: [
      { type: 'money', value: 1000, description: 'Sponsorship payment' },
      { type: 'free_training', value: 100, description: 'Free gym access' },
      { type: 'local_recognition', value: 10, description: 'Local reputation boost' },
    ],
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    negotiable: true,
    difficulty: 'easy',
  },
  {
    id: 'sports_drink_promotion',
    sponsorId: 'sports_drink_co',
    type: 'promotion',
    title: 'Sports Drink Promotion',
    description: 'Promote sports drinks during your fights',
    duration: 10,
    requirements: [
      { type: 'level', value: 4 },
      { type: 'reputation', value: 35 },
    ],
    rewards: [
      { type: 'money', value: 800, description: 'Promotion fee' },
      { type: 'free_products', value: 50, description: 'Free sports drinks' },
      { type: 'hydration_bonus', value: 10, description: 'Hydration bonus' },
    ],
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    negotiable: true,
    difficulty: 'easy',
  },

  // Local Offers
  {
    id: 'corner_store_deal',
    sponsorId: 'corner_store',
    type: 'local_business',
    title: 'Corner Store Partnership',
    description: 'Partner with local corner store for promotions',
    duration: 7,
    requirements: [
      { type: 'level', value: 2 },
      { type: 'reputation', value: 20 },
    ],
    rewards: [
      { type: 'money', value: 300, description: 'Partnership payment' },
      { type: 'store_discount', value: 15, description: 'Store discount' },
      { type: 'local_support', value: 5, description: 'Local support' },
    ],
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    negotiable: false,
    difficulty: 'very_easy',
  },
  {
    id: 'family_meal_sponsorship',
    sponsorId: 'family_restaurant',
    type: 'food_sponsorship',
    title: 'Family Meal Sponsorship',
    description: 'Family restaurant provides meal sponsorship',
    duration: 5,
    requirements: [
      { type: 'level', value: 1 },
      { type: 'reputation', value: 15 },
    ],
    rewards: [
      { type: 'money', value: 200, description: 'Sponsorship payment' },
      { type: 'free_meals', value: 40, description: 'Free meals' },
      { type: 'community_goodwill', value: 8, description: 'Community goodwill' },
    ],
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
    negotiable: false,
    difficulty: 'very_easy',
  },
];

// ============================================================================
// CONTRACT TEMPLATES
// ============================================================================

const CONTRACT_TEMPLATES: SponsorContract[] = [
  // These would be generated from offers, but here are some base templates
];

// ============================================================================
// MAIN CONFIGURATION
// ============================================================================

export const PUNCH_CLUB_SPONSOR_CONFIG: SponsorSystemConfig = {
  version: '1.0.0',
  sponsors: SPONSOR_TEMPLATES,
  offers: OFFER_TEMPLATES,
  contracts: CONTRACT_TEMPLATES,
  negotiationConfig: {
    baseSuccessRate: 0.5,
    charismaMultiplier: 0.1,
    reputationMultiplier: 0.1,
    experienceMultiplier: 0.1,
    riskPenalty: 0.1,
    rewardBonus: 0.05,
    maxNegotiationAttempts: 3,
    negotiationCooldown: 24 * 60 * 60 * 1000, // 24 hours
  },
  contractConfig: {
    maxActiveContracts: 3,
    maxConcurrentExclusive: 1,
    completionBonus: 0.1,
    earlyTerminationPenalty: 0.2,
    gracePeriod: 2 * 24 * 60 * 60 * 1000, // 48 hours
  },
  rewardConfig: {
    baseRewardMultiplier: 1.0,
    tierMultipliers: {
      elite: 1.5,
      premium: 1.3,
      standard: 1.1,
      local: 0.9,
    },
    categoryMultipliers: {
      sports: 1.2,
      nutrition: 1.1,
      equipment: 1.15,
      media: 1.3,
      healthcare: 1.0,
      finance: 1.25,
      entertainment: 1.1,
      technology: 1.2,
    },
    reputationBonus: 0.01, // 1% bonus per reputation point
    completionBonus: 0.1, // 10% bonus for completion
  },
  relationshipConfig: {
    baseTrust: 50,
    trustGainPerContract: 5,
    trustLossPerCancellation: 10,
    trustGainPerNegotiation: 2,
    trustLossPerFailedNegotiation: 1,
    maxTrust: 100,
    minTrust: 0,
    relationshipDecayRate: 0.01, // 1% per day without interaction
  },
  reputationConfig: {
    baseReputation: 50,
    reputationGainPerContract: 2,
    reputationLossPerCancellation: 5,
    reputationGainPerNegotiation: 1,
    reputationLossPerFailedNegotiation: 1,
    maxReputation: 100,
    minReputation: 0,
    sponsorReputationImpact: 0.1, // 10% of sponsor reputation affects character reputation
  },
  opportunityConfig: {
    baseOfferFrequency: 0.1, // 10% chance per day
    sponsorRelationshipBonus: 0.05, // 5% bonus per sponsor relationship level
    reputationBonus: 0.02, // 2% bonus per reputation point
    maxDailyOffers: 3,
    offerExpiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    priorityWeights: {
      tier: 0.3,
      relationship: 0.25,
      reputation: 0.2,
      reward: 0.15,
      urgency: 0.1,
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get sponsor by ID
 */
export function getSponsorById(sponsorId: string): Sponsor | undefined {
  return PUNCH_CLUB_SPONSOR_CONFIG.sponsors.find(sponsor => sponsor.id === sponsorId);
}

/**
 * Get sponsors by tier
 */
export function getSponsorsByTier(tier: SponsorTier): Sponsor[] {
  return PUNCH_CLUB_SPONSOR_CONFIG.sponsors.filter(sponsor => sponsor.tier === tier);
}

/**
 * Get sponsors by category
 */
export function getSponsorsByCategory(category: SponsorCategory): Sponsor[] {
  return PUNCH_CLUB_SPONSOR_CONFIG.sponsors.filter(sponsor => sponsor.category === category);
}

/**
 * Get offer by ID
 */
export function getOfferById(offerId: string): SponsorOffer | undefined {
  return PUNCH_CLUB_SPONSOR_CONFIG.offers.find(offer => offer.id === offerId);
}

/**
 * Get offers by sponsor
 */
export function getOffersBySponsor(sponsorId: string): SponsorOffer[] {
  return PUNCH_CLUB_SPONSOR_CONFIG.offers.filter(offer => offer.sponsorId === sponsorId);
}

/**
 * Get offers by difficulty
 */
export function getOffersByDifficulty(difficulty: string): SponsorOffer[] {
  return PUNCH_CLUB_SPONSOR_CONFIG.offers.filter(offer => offer.difficulty === difficulty);
}

/**
 * Get sponsor tier display name
 */
export function getSponsorTierDisplayName(tier: SponsorTier): string {
  const names = {
    elite: 'Elite',
    premium: 'Premium',
    standard: 'Standard',
    local: 'Local',
  };
  return names[tier];
}

/**
 * Get sponsor category display name
 */
export function getSponsorCategoryDisplayName(category: SponsorCategory): string {
  const names = {
    sports: 'Sports',
    nutrition: 'Nutrition',
    equipment: 'Equipment',
    media: 'Media',
    healthcare: 'Healthcare',
    finance: 'Finance',
    entertainment: 'Entertainment',
    technology: 'Technology',
  };
  return names[category];
}

/**
 * Get offer type display name
 */
export function getOfferTypeDisplayName(type: string): string {
  const names = {
    championship: 'Championship',
    exclusive: 'Exclusive',
    endorsement: 'Endorsement',
    training: 'Training',
    facility: 'Facility',
    promotion: 'Promotion',
    local_business: 'Local Business',
    food_sponsorship: 'Food Sponsorship',
  };
  return names[type as keyof typeof names] || type;
}

/**
 * Get reward type display name
 */
export function getRewardTypeDisplayName(type: string): string {
  const names = {
    money: 'Money',
    energy_boost: 'Energy Boost',
    reputation: 'Reputation',
    equipment: 'Equipment',
    training_bonus: 'Training Bonus',
    recovery_bonus: 'Recovery Bonus',
    free_products: 'Free Products',
    equipment_bonus: 'Equipment Bonus',
    durability_bonus: 'Durability Bonus',
    free_training: 'Free Training',
    local_recognition: 'Local Recognition',
    hydration_bonus: 'Hydration Bonus',
    store_discount: 'Store Discount',
    local_support: 'Local Support',
    free_meals: 'Free Meals',
    community_goodwill: 'Community Goodwill',
  };
  return names[type as keyof typeof names] || type;
}

/**
 * Calculate offer value
 */
export function calculateOfferValue(offer: SponsorOffer): number {
  let totalValue = 0;
  
  offer.rewards.forEach(reward => {
    if (reward.type === 'money') {
      totalValue += reward.value;
    } else {
      // Assign monetary value to non-monetary rewards
      const rewardValues: Record<string, number> = {
        energy_boost: 100,
        reputation: 50,
        equipment: 200,
        training_bonus: 150,
        recovery_bonus: 120,
        free_products: 80,
        equipment_bonus: 100,
        durability_bonus: 90,
        free_training: 200,
        local_recognition: 60,
        hydration_bonus: 70,
        store_discount: 40,
        local_support: 30,
        free_meals: 50,
        community_goodwill: 35,
      };
      
      totalValue += (rewardValues[reward.type] || 50) * (reward.value / 100);
    }
  });
  
  return totalValue;
}

/**
 * Get sponsor requirements text
 */
export function getSponsorRequirementsText(requirements: SponsorRequirement[]): string {
  return requirements.map(req => {
    switch (req.type) {
      case 'level':
        return `Level ${req.value}+`;
      case 'reputation':
        return `Reputation ${req.value}+`;
      case 'stat':
        return `${req.stat} ${req.value}+`;
      case 'completed_contracts':
        return `${req.value}+ completed contracts`;
      case 'active_contracts':
        return `Max ${req.value} active contracts`;
      case 'sponsor_relationship':
        return `Sponsor relationship level ${req.value}+`;
      case 'tier':
        return `Sponsor tier: ${req.value}`;
      default:
        return `${req.type}: ${req.value}`;
    }
  }).join(', ');
}

/**
 * Check if offer is expiring soon
 */
export function isOfferExpiringSoon(offer: SponsorOffer): boolean {
  if (!offer.expiresAt) return false;
  
  const timeUntilExpiry = offer.expiresAt.getTime() - Date.now();
  return timeUntilExpiry < 24 * 60 * 60 * 1000; // Less than 24 hours
}

/**
 * Get offer urgency level
 */
export function getOfferUrgencyLevel(offer: SponsorOffer): 'low' | 'medium' | 'high' | 'critical' {
  if (!offer.expiresAt) return 'low';
  
  const timeUntilExpiry = offer.expiresAt.getTime() - Date.now();
  const hoursUntilExpiry = timeUntilExpiry / (60 * 60 * 1000);
  
  if (hoursUntilExpiry < 6) return 'critical';
  if (hoursUntilExpiry < 24) return 'high';
  if (hoursUntilExpiry < 72) return 'medium';
  return 'low';
}

/**
 * Generate sponsor opportunities based on character stats
 */
export function generateSponsorOpportunities(
  characterLevel: number,
  reputation: number,
  completedContracts: number,
  activeSponsors: string[]
): SponsorOffer[] {
  return PUNCH_CLUB_SPONSOR_CONFIG.offers.filter(offer => {
    // Check if already sponsored
    if (activeSponsors.includes(offer.sponsorId)) {
      return false;
    }
    
    // Check requirements
    return offer.requirements.every(req => {
      switch (req.type) {
        case 'level':
          return characterLevel >= req.value;
        case 'reputation':
          return reputation >= req.value;
        case 'completed_contracts':
          return completedContracts >= req.value;
        default:
          return true;
      }
    });
  });
}

/**
 * Calculate negotiation success chance
 */
export function calculateNegotiationSuccessChance(
  sponsor: Sponsor,
  characterReputation: number,
  relationshipLevel: number,
  negotiationPoints: {
    charisma: number;
    reputation: number;
    experience: number;
    riskLevel: number;
    rewardMultiplier: number;
  }
): number {
  let chance = PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig.baseSuccessRate;
  
  // Sponsor difficulty
  chance -= sponsor.negotiationDifficulty * 0.3;
  
  // Character reputation
  chance += (characterReputation / 100) * PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig.reputationMultiplier;
  
  // Relationship level
  chance += (relationshipLevel / 5) * 0.2;
  
  // Negotiation points
  chance += (negotiationPoints.charisma / 100) * PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig.charismaMultiplier;
  chance += (negotiationPoints.reputation / 100) * PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig.reputationMultiplier;
  chance += (negotiationPoints.experience / 100) * PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig.experienceMultiplier;
  
  // Risk vs reward
  chance -= negotiationPoints.riskLevel * PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig.riskPenalty;
  chance += negotiationPoints.rewardMultiplier * PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig.rewardBonus;
  
  return Math.max(0.1, Math.min(0.9, chance));
}
