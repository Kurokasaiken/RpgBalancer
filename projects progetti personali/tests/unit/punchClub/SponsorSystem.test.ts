/**
 * Punch Club Sponsor System Tests
 * 
 * Unit tests for sponsor management, offers, contracts, negotiations, and rewards
 * 
 * @author RPG Balancer Team
 * @since 2026-01-24
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { 
  Sponsor, 
  SponsorOffer, 
  SponsorContract, 
  SponsorTier,
  SponsorCategory,
  NegotiationResult,
  SponsorReward,
  SponsorStatistics 
} from '@/ui/punchClub/sponsor/sponsorSystem';
import { SponsorSystem } from '@/ui/punchClub/sponsor/sponsorSystem';
import { PUNCH_CLUB_SPONSOR_CONFIG } from '@/ui/punchClub/sponsor/sponsorConfig';

// Mock PersistenceService
const mockPersistence = {
  saveData: vi.fn(),
  loadData: vi.fn(),
};

// Mock Character
const mockCharacter = {
  id: 'test-character-123',
  name: 'Test Fighter',
  archetype: 'brawler',
  stats: {
    strength: 50,
    agility: 45,
    intelligence: 30,
    vitality: 60,
  },
  level: 5,
  experience: 1000,
};

describe('SponsorSystem', () => {
  let sponsorSystem: SponsorSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    sponsorSystem = new SponsorSystem(PUNCH_CLUB_SPONSOR_CONFIG, mockPersistence);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      expect(sponsorSystem).toBeDefined();
      const config = sponsorSystem.getConfig();
      expect(config.version).toBe('1.0.0');
      expect(config.sponsors).toBeDefined();
      expect(config.offers).toBeDefined();
    });

    it('should clear cache when config is updated', () => {
      const newConfig = { ...PUNCH_CLUB_SPONSOR_CONFIG, version: '2.0.0' };
      sponsorSystem.updateConfig(newConfig);
      expect(sponsorSystem.getConfig().version).toBe('2.0.0');
    });
  });

  describe('Sponsor Record Management', () => {
    it('should create default sponsor record for new character', async () => {
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      
      expect(record.characterId).toBe(mockCharacter.id);
      expect(record.sponsors).toEqual([]);
      expect(record.activeContracts).toEqual([]);
      expect(record.completedContracts).toEqual([]);
      expect(record.totalEarnings).toBe(0);
      expect(record.reputation).toBe(50);
    });

    it('should load existing sponsor record from persistence', async () => {
      const existingRecord = {
        characterId: mockCharacter.id,
        sponsors: [],
        activeContracts: [],
        completedContracts: [],
        rejectedOffers: [],
        pendingOffers: [],
        relationshipHistory: [],
        totalEarnings: 1000,
        reputation: 75,
        lastUpdated: new Date('2026-01-24'),
      };

      mockPersistence.loadData.mockResolvedValue(existingRecord);
      
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      
      expect(record.characterId).toBe(mockCharacter.id);
      expect(record.totalEarnings).toBe(1000);
      expect(record.reputation).toBe(75);
      expect(mockPersistence.loadData).toHaveBeenCalledWith(`sponsor_record_${mockCharacter.id}`);
    });

    it('should save sponsor record to persistence', async () => {
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      
      record.reputation = 80;
      
      await sponsorSystem.saveSponsorRecord(mockCharacter.id, record);
      
      expect(mockPersistence.saveData).toHaveBeenCalledWith(
        `sponsor_record_${mockCharacter.id}`,
        expect.objectContaining({
          reputation: 80,
          lastUpdated: expect.any(Date),
        })
      );
    });

    it('should validate sponsor record before saving', async () => {
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      
      const invalidRecord = { ...record, characterId: '' };
      
      await expect(
        sponsorSystem.saveSponsorRecord(mockCharacter.id, invalidRecord)
      ).rejects.toThrow('Character ID required');
    });
  });

  describe('Sponsor Management', () => {
    it('should get available sponsors for character', async () => {
      const sponsors = await sponsorSystem.getAvailableSponsors(mockCharacter.id);
      
      expect(sponsors).toBeDefined();
      expect(Array.isArray(sponsors)).toBe(true);
      
      // Should include local sponsors that don't have strict requirements
      const localSponsors = sponsors.filter(s => s.tier === 'local');
      expect(localSponsors.length).toBeGreaterThan(0);
    });

    it('should filter sponsors by requirements', async () => {
      // Create a high-level character
      const highLevelCharacter = {
        ...mockCharacter,
        level: 15,
        stats: {
          strength: 80,
          agility: 75,
          intelligence: 50,
          vitality: 90,
        },
      };

      const sponsors = await sponsorSystem.getAvailableSponsors(highLevelCharacter.id);
      
      // Should include elite sponsors for high-level character
      const eliteSponsors = sponsors.filter(s => s.tier === 'elite');
      expect(eliteSponsors.length).toBeGreaterThan(0);
    });

    it('should get sponsor details', async () => {
      const sponsorId = 'local_gym';
      const sponsor = await sponsorSystem.getSponsorDetails(mockCharacter.id, sponsorId);
      
      expect(sponsor).toBeDefined();
      expect(sponsor?.id).toBe(sponsorId);
      expect(sponsor?.name).toBe('Local Gym');
      expect(sponsor?.tier).toBe('standard');
    });

    it('should return null for non-existent sponsor', async () => {
      const sponsor = await sponsorSystem.getSponsorDetails(mockCharacter.id, 'non-existent');
      expect(sponsor).toBeNull();
    });
  });

  describe('Offer Management', () => {
    it('should get available offers for character', async () => {
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      
      expect(offers).toBeDefined();
      expect(Array.isArray(offers)).toBe(true);
      
      // Should include offers that match character level
      const validOffers = offers.filter(offer => 
        offer.requirements.some(req => req.type === 'level' && req.value <= mockCharacter.level)
      );
      expect(validOffers.length).toBeGreaterThan(0);
    });

    it('should accept offer successfully', async () => {
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.sponsorId === 'local_gym');
      
      if (!offer) {
        throw new Error('No suitable offer found');
      }

      const contract = await sponsorSystem.acceptOffer(mockCharacter.id, offer.id);
      
      expect(contract).toBeDefined();
      expect(contract.offerId).toBe(offer.id);
      expect(contract.sponsorId).toBe(offer.sponsorId);
      expect(contract.characterId).toBe(mockCharacter.id);
      expect(contract.status).toBe('active');
      expect(contract.startDate).toBeInstanceOf(Date);
      expect(contract.endDate).toBeInstanceOf(Date);
    });

    it('should prevent accepting non-existent offer', async () => {
      await expect(
        sponsorSystem.acceptOffer(mockCharacter.id, 'non-existent-offer')
      ).rejects.toThrow('Offer non-existent-offer not found');
    });

    it('should reject offer successfully', async () => {
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.sponsorId === 'corner_store');
      
      if (!offer) {
        throw new Error('No suitable offer found');
      }

      await sponsorSystem.rejectOffer(mockCharacter.id, offer.id);
      
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      const rejectedOffer = record.rejectedOffers.find(o => o.offerId === offer.id);
      
      expect(rejectedOffer).toBeDefined();
      expect(rejectedOffer?.offerId).toBe(offer.id);
      expect(rejectedOffer?.sponsorId).toBe(offer.sponsorId);
      expect(rejectedOffer?.rejectedAt).toBeInstanceOf(Date);
    });
  });

  describe('Contract Management', () => {
    beforeEach(async () => {
      // Set up a contract for testing
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.sponsorId === 'local_gym');
      
      if (offer) {
        await sponsorSystem.acceptOffer(mockCharacter.id, offer.id);
      }
    });

    it('should get active contracts', async () => {
      const contracts = await sponsorSystem.getActiveContracts(mockCharacter.id);
      
      expect(contracts).toBeDefined();
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);
      
      const contract = contracts[0];
      expect(contract.status).toBe('active');
      expect(contract.characterId).toBe(mockCharacter.id);
    });

    it('should get contract history', async () => {
      const history = await sponsorSystem.getContractHistory(mockCharacter.id);
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should update contract progress', async () => {
      const contracts = await sponsorSystem.getActiveContracts(mockCharacter.id);
      const contract = contracts[0];
      
      await sponsorSystem.updateContractProgress(mockCharacter.id, contract.id, 50);
      
      const updatedContracts = await sponsorSystem.getActiveContracts(mockCharacter.id);
      const updatedContract = updatedContracts.find(c => c.id === contract.id);
      
      expect(updatedContract?.progress).toBe(50);
    });

    it('should complete contract when progress reaches 100%', async () => {
      const contracts = await sponsorSystem.getActiveContracts(mockCharacter.id);
      const contract = contracts[0];
      
      await sponsorSystem.updateContractProgress(mockCharacter.id, contract.id, 100);
      
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      const completedContract = record.completedContracts.find(c => c.id === contract.id);
      
      expect(completedContract).toBeDefined();
      expect(completedContract?.completed).toBe(true);
      expect(completedContract?.status).toBe('completed');
      expect(completedContract?.earnings).toBeGreaterThan(0);
    });

    it('should cancel contract with reason', async () => {
      const contracts = await sponsorSystem.getActiveContracts(mockCharacter.id);
      const contract = contracts[0];
      
      await sponsorSystem.cancelContract(mockCharacter.id, contract.id, 'Too difficult');
      
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      const cancelledContract = record.completedContracts.find(c => c.id === contract.id);
      
      expect(cancelledContract).toBeDefined();
      expect(cancelledContract?.status).toBe('cancelled');
      expect(cancelledContract?.cancelReason).toBe('Too difficult');
      expect(cancelledContract?.cancelledAt).toBeInstanceOf(Date);
    });
  });

  describe('Negotiation System', () => {
    it('should negotiate offer successfully', async () => {
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.negotiable);
      
      if (!offer) {
        throw new Error('No negotiable offer found');
      }

      const negotiationPoints = {
        charisma: 70,
        reputation: 60,
        experience: 50,
        riskLevel: 0.3,
        rewardMultiplier: 0.2,
      };

      const result = await sponsorSystem.negotiateOffer(mockCharacter.id, offer.id, negotiationPoints);
      
      expect(result).toBeDefined();
      expect(result.originalOffer.id).toBe(offer.id);
      expect(result.negotiationPoints).toEqual(negotiationPoints);
      expect(result.successChance).toBeGreaterThanOrEqual(0);
      expect(result.successChance).toBeLessThanOrEqual(1);
    });

    it('should create negotiated offer on success', async () => {
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.negotiable);
      
      if (!offer) {
        throw new Error('No negotiable offer found');
      }

      const negotiationPoints = {
        charisma: 90,
        reputation: 80,
        experience: 70,
        riskLevel: 0.2,
        rewardMultiplier: 0.3,
      };

      // Mock success
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // Low value = success
      
      const result = await sponsorSystem.negotiateOffer(mockCharacter.id, offer.id, negotiationPoints);
      
      if (result.success) {
        const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
        const pendingOffer = record.pendingOffers.find(o => o.originalOfferId === offer.id);
        
        expect(pendingOffer).toBeDefined();
        expect(pendingOffer?.negotiated).toBe(true);
        expect(pendingOffer?.expiresAt).toBeInstanceOf(Date);
      }
      
      vi.restoreAllMocks();
    });

    it('should handle failed negotiation', async () => {
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.negotiable);
      
      if (!offer) {
        throw new Error('No negotiable offer found');
      }

      const negotiationPoints = {
        charisma: 20,
        reputation: 20,
        experience: 20,
        riskLevel: 0.8,
        rewardMultiplier: 0.1,
      };

      // Mock failure
      vi.spyOn(Math, 'random').mockReturnValue(0.9); // High value = failure
      
      const result = await sponsorSystem.negotiateOffer(mockCharacter.id, offer.id, negotiationPoints);
      
      expect(result.success).toBe(false);
      expect(result.negotiatedOffer.id).toBe(offer.id); // Returns original offer
      
      vi.restoreAllMocks();
    });
  });

  describe('Rewards and Benefits', () => {
    beforeEach(async () => {
      // Set up a completed contract for testing
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.sponsorId === 'local_gym');
      
      if (offer) {
        const contract = await sponsorSystem.acceptOffer(mockCharacter.id, offer.id);
        await sponsorSystem.updateContractProgress(mockCharacter.id, contract.id, 100);
      }
    });

    it('should claim rewards for completed contract', async () => {
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      const completedContract = record.completedContracts.find(c => c.completed && !c.rewardsClaimed);
      
      if (!completedContract) {
        throw new Error('No completed contract with unclaimed rewards found');
      }

      const rewards = await sponsorSystem.claimRewards(mockCharacter.id, completedContract.id);
      
      expect(rewards).toBeDefined();
      expect(Array.isArray(rewards)).toBe(true);
      expect(rewards.length).toBeGreaterThan(0);
      
      const updatedRecord = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      const updatedContract = updatedRecord.completedContracts.find(c => c.id === completedContract.id);
      
      expect(updatedContract?.rewardsClaimed).toBe(true);
      expect(updatedContract?.rewardsClaimedAt).toBeInstanceOf(Date);
    });

    it('should prevent claiming rewards twice', async () => {
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      const completedContract = record.completedContracts.find(c => c.completed && !c.rewardsClaimed);
      
      if (!completedContract) {
        throw new Error('No completed contract with unclaimed rewards found');
      }

      // Claim rewards first time
      await sponsorSystem.claimRewards(mockCharacter.id, completedContract.id);
      
      // Try to claim again
      await expect(
        sponsorSystem.claimRewards(mockCharacter.id, completedContract.id)
      ).rejects.toThrow('Rewards for contract');
    });

    it('should get sponsor benefits', async () => {
      const benefits = await sponsorSystem.getSponsorBenefits(mockCharacter.id);
      
      expect(benefits).toBeDefined();
      expect(Array.isArray(benefits)).toBe(true);
      
      // Should include benefits from sponsor relationships
      const activeBenefits = benefits.filter(b => b.active);
      expect(activeBenefits.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Analytics and Statistics', () => {
    beforeEach(async () => {
      // Set up some data for statistics
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      
      // Accept and complete a few contracts
      for (let i = 0; i < 3 && i < offers.length; i++) {
        const contract = await sponsorSystem.acceptOffer(mockCharacter.id, offers[i].id);
        await sponsorSystem.updateContractProgress(mockCharacter.id, contract.id, 100);
      }
    });

    it('should get sponsor statistics', async () => {
      const stats = await sponsorSystem.getSponsorStatistics(mockCharacter.id);
      
      expect(stats).toBeDefined();
      expect(stats.totalSponsors).toBeGreaterThanOrEqual(0);
      expect(stats.activeContracts).toBeGreaterThanOrEqual(0);
      expect(stats.completedContracts).toBeGreaterThanOrEqual(0);
      expect(stats.totalEarnings).toBeGreaterThanOrEqual(0);
      expect(stats.reputation).toBeGreaterThanOrEqual(0);
      expect(stats.averageContractValue).toBeGreaterThanOrEqual(0);
      expect(stats.negotiationSuccessRate).toBeGreaterThanOrEqual(0);
      expect(stats.mostActiveCategory).toBeDefined();
    });

    it('should calculate average contract value correctly', async () => {
      const stats = await sponsorSystem.getSponsorStatistics(mockCharacter.id);
      
      if (stats.completedContracts > 0) {
        expect(stats.averageContractValue).toBeGreaterThan(0);
        expect(stats.averageContractValue).toBe(Math.floor(stats.totalEarnings / stats.completedContracts));
      }
    });

    it('should identify top sponsor', async () => {
      const stats = await sponsorSystem.getSponsorStatistics(mockCharacter.id);
      
      if (stats.totalSponsors > 0) {
        expect(stats.topSponsor).toBeDefined();
        expect(stats.topSponsor?.totalEarnings).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Opportunity Generation', () => {
    it('should generate sponsor opportunities', async () => {
      const opportunities = await sponsorSystem.generateSponsorOpportunities(mockCharacter.id);
      
      expect(opportunities).toBeDefined();
      expect(Array.isArray(opportunities)).toBe(true);
      
      if (opportunities.length > 0) {
        const opportunity = opportunities[0];
        expect(opportunity.offer).toBeDefined();
        expect(opportunity.sponsor).toBeDefined();
        expect(opportunity.matchScore).toBeGreaterThanOrEqual(0);
        expect(opportunity.matchScore).toBeLessThanOrEqual(100);
        expect(opportunity.priority).toBeGreaterThanOrEqual(0);
        expect(opportunity.priority).toBeLessThanOrEqual(100);
      }
    });

    it('should sort opportunities by priority and match score', async () => {
      const opportunities = await sponsorSystem.generateSponsorOpportunities(mockCharacter.id);
      
      if (opportunities.length > 1) {
        for (let i = 0; i < opportunities.length - 1; i++) {
          const current = opportunities[i];
          const next = opportunities[i + 1];
          
          // Should be sorted by priority first, then match score
          if (current.priority !== next.priority) {
            expect(current.priority).toBeGreaterThanOrEqual(next.priority);
          } else {
            expect(current.matchScore).toBeGreaterThanOrEqual(next.matchScore);
          }
        }
      }
    });
  });

  describe('Event System', () => {
    it('should emit events for sponsor actions', async () => {
      const eventListener = vi.fn();
      sponsorSystem.on('offer_accepted', eventListener);
      
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.sponsorId === 'local_gym');
      
      if (offer) {
        await sponsorSystem.acceptOffer(mockCharacter.id, offer.id);
        
        expect(eventListener).toHaveBeenCalledWith(
          expect.objectContaining({
            characterId: mockCharacter.id,
            offer: expect.objectContaining({ id: offer.id }),
            contract: expect.any(Object),
          })
        );
      }
      
      sponsorSystem.off('offer_accepted', eventListener);
    });

    it('should handle event listener errors gracefully', async () => {
      const faultyListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      
      sponsorSystem.on('offer_accepted', faultyListener);
      
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.sponsorId === 'local_gym');
      
      if (offer) {
        // Should not throw despite listener error
        await expect(
          sponsorSystem.acceptOffer(mockCharacter.id, offer.id)
        ).resolves.toBeDefined();
      }
      
      sponsorSystem.off('offer_accepted', faultyListener);
    });
  });

  describe('Cache Management', () => {
    it('should cache sponsor records', async () => {
      // First call should hit persistence
      const record1 = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      expect(mockPersistence.loadData).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const record2 = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      expect(mockPersistence.loadData).toHaveBeenCalledTimes(1);
      
      expect(record1).toBe(record2);
    });

    it('should clear cache when config is updated', async () => {
      // Load to populate cache
      await sponsorSystem.getSponsorRecord(mockCharacter.id);
      
      // Clear cache
      sponsorSystem.clearCache();
      
      // Load again (should hit persistence)
      await sponsorSystem.getSponsorRecord(mockCharacter.id);
      expect(mockPersistence.loadData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate sponsor system config', () => {
      const validConfig = {
        version: '1.0.0',
        sponsors: PUNCH_CLUB_SPONSOR_CONFIG.sponsors.slice(0, 1),
        offers: PUNCH_CLUB_SPONSOR_CONFIG.offers.slice(0, 1),
        contracts: [],
        negotiationConfig: PUNCH_CLUB_SPONSOR_CONFIG.negotiationConfig,
        contractConfig: PUNCH_CLUB_SPONSOR_CONFIG.contractConfig,
        rewardConfig: PUNCH_CLUB_SPONSOR_CONFIG.rewardConfig,
        relationshipConfig: PUNCH_CLUB_SPONSOR_CONFIG.relationshipConfig,
        reputationConfig: PUNCH_CLUB_SPONSOR_CONFIG.reputationConfig,
        opportunityConfig: PUNCH_CLUB_SPONSOR_CONFIG.opportunityConfig,
      };
      
      expect(() => {
        sponsorSystem.updateConfig(validConfig);
      }).not.toThrow();
    });

    it('should reject invalid config', () => {
      const invalidConfig = { version: '1.0.0' };
      
      expect(() => {
        sponsorSystem.updateConfig(invalidConfig);
      }).toThrow('Invalid sponsor system configuration');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sponsor record', async () => {
      const record = await sponsorSystem.getSponsorRecord('empty-character');
      
      expect(record.sponsors).toHaveLength(0);
      expect(record.activeContracts).toHaveLength(0);
      expect(record.totalEarnings).toBe(0);
    });

    it('should handle invalid sponsor record data', async () => {
      mockPersistence.loadData.mockResolvedValue(null);
      
      const record = await sponsorSystem.getSponsorRecord('invalid-character');
      
      expect(record).toBeDefined();
      expect(record.characterId).toBe('invalid-character');
      expect(record.sponsors).toEqual([]);
    });

    it('should handle corrupted sponsor record data', async () => {
      mockPersistence.loadData.mockResolvedValue({ invalid: 'data' });
      
      const record = await sponsorSystem.getSponsorRecord('corrupted-character');
      
      expect(record).toBeDefined();
      expect(record.characterId).toBe('unknown');
      expect(record.sponsors).toEqual([]);
    });

    it('should handle persistence errors gracefully', async () => {
      mockPersistence.saveData.mockRejectedValue(new Error('Storage error'));
      
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      
      await expect(
        sponsorSystem.saveSponsorRecord(mockCharacter.id, record)
      ).rejects.toThrow('Storage error');
    });

    it('should handle negotiation with non-negotiable offer', async () => {
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const nonNegotiableOffer = offers.find(o => !o.negotiable);
      
      if (!nonNegotiableOffer) {
        throw new Error('No non-negotiable offer found');
      }

      const negotiationPoints = {
        charisma: 70,
        reputation: 60,
        experience: 50,
        riskLevel: 0.3,
        rewardMultiplier: 0.2,
      };

      // Should still work but with lower success chance
      const result = await sponsorSystem.negotiateOffer(mockCharacter.id, nonNegotiableOffer.id, negotiationPoints);
      
      expect(result).toBeDefined();
      expect(result.successChance).toBeLessThan(0.5); // Lower chance for non-negotiable
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete sponsor lifecycle', async () => {
      // 1. Get available sponsors
      const sponsors = await sponsorSystem.getAvailableSponsors(mockCharacter.id);
      expect(sponsors.length).toBeGreaterThan(0);
      
      // 2. Get available offers
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      expect(offers.length).toBeGreaterThan(0);
      
      // 3. Accept offer
      const offer = offers[0];
      const contract = await sponsorSystem.acceptOffer(mockCharacter.id, offer.id);
      expect(contract.status).toBe('active');
      
      // 4. Update progress
      await sponsorSystem.updateContractProgress(mockCharacter.id, contract.id, 50);
      
      // 5. Complete contract
      await sponsorSystem.updateContractProgress(mockCharacter.id, contract.id, 100);
      
      // 6. Claim rewards
      const rewards = await sponsorSystem.claimRewards(mockCharacter.id, contract.id);
      expect(rewards.length).toBeGreaterThan(0);
      
      // 7. Check statistics
      const stats = await sponsorSystem.getSponsorStatistics(mockCharacter.id);
      expect(stats.completedContracts).toBe(1);
      expect(stats.totalEarnings).toBeGreaterThan(0);
    });

    it('should handle multiple sponsor relationships', async () => {
      // Accept multiple offers from different sponsors
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const uniqueSponsors = [...new Set(offers.map(o => o.sponsorId))];
      
      // Accept up to 3 different sponsor offers
      const contracts = [];
      for (let i = 0; i < Math.min(3, uniqueSponsors.length); i++) {
        const sponsorId = uniqueSponsors[i];
        const offer = offers.find(o => o.sponsorId === sponsorId);
        
        if (offer) {
          const contract = await sponsorSystem.acceptOffer(mockCharacter.id, offer.id);
          contracts.push(contract);
        }
      }
      
      // Check sponsor relationships
      const record = await sponsorSystem.getSponsorRecord(mockCharacter.id);
      expect(record.sponsors.length).toBe(contracts.length);
      
      // Check statistics
      const stats = await sponsorSystem.getSponsorStatistics(mockCharacter.id);
      expect(stats.totalSponsors).toBe(contracts.length);
      expect(stats.activeContracts).toBe(contracts.length);
    });

    it('should handle negotiation with relationship bonus', async () => {
      // First, establish relationship with a sponsor
      const offers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const offer = offers.find(o => o.sponsorId === 'local_gym');
      
      if (!offer) {
        throw new Error('No suitable offer found');
      }

      // Accept and complete first contract
      const contract1 = await sponsorSystem.acceptOffer(mockCharacter.id, offer.id);
      await sponsorSystem.updateContractProgress(mockCharacter.id, contract1.id, 100);
      await sponsorSystem.claimRewards(mockCharacter.id, contract1.id);
      
      // Now negotiate a second offer from same sponsor
      const secondOffers = await sponsorSystem.getAvailableOffers(mockCharacter.id);
      const secondOffer = secondOffers.find(o => o.sponsorId === 'local_gym' && o.id !== offer.id);
      
      if (secondOffer) {
        const negotiationPoints = {
          charisma: 50,
          reputation: 50,
          experience: 50,
          riskLevel: 0.3,
          rewardMultiplier: 0.2,
        };

        const result = await sponsorSystem.negotiateOffer(mockCharacter.id, secondOffer.id, negotiationPoints);
        
        // Should have higher success chance due to existing relationship
        expect(result.successChance).toBeGreaterThan(0.5);
        expect(result.sponsorRelationship).toBeDefined();
        expect(result.sponsorRelationship?.level).toBeGreaterThan(0);
      }
    });
  });
});
