/**
 * Punch Club Sponsor System Hook
 * 
 * React hook for managing character sponsor relationships, offers, and contracts
 * 
 * @see NP-243 – Sponsor System
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Character } from '@/balancing/character/types';
import type { 
  Sponsor, 
  SponsorOffer, 
  SponsorContract, 
  SponsorTier,
  SponsorCategory,
  NegotiationResult,
  SponsorReward,
  SponsorStatistics,
  SponsorOpportunity,
  SponsorBenefit,
  NegotiationPoints 
} from '../sponsorSystem';
import type { SponsorSystem } from '../sponsorSystem';
import { 
  PUNCH_CLUB_SPONSOR_CONFIG,
  getSponsorTierDisplayName,
  getSponsorCategoryDisplayName,
  getOfferTypeDisplayName,
  getRewardTypeDisplayName,
  calculateOfferValue,
  getSponsorRequirementsText,
  isOfferExpiringSoon,
  getOfferUrgencyLevel,
  calculateNegotiationSuccessChance
} from '../sponsorConfig';

// ============================================================================
// HOOK STATE INTERFACE
// ============================================================================

interface UseSponsorSystemState {
  /** Current sponsor record */
  sponsorRecord: any;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Available sponsors */
  availableSponsors: Sponsor[];
  
  /** Available offers */
  availableOffers: SponsorOffer[];
  
  /** Active contracts */
  activeContracts: SponsorContract[];
  
  /** Contract history */
  contractHistory: SponsorContract[];
  
  /** Sponsor statistics */
  sponsorStatistics: SponsorStatistics | null;
  
  /** Sponsor opportunities */
  sponsorOpportunities: SponsorOpportunity[];
  
  /** Sponsor benefits */
  sponsorBenefits: SponsorBenefit[];
  
  /** Selected sponsor for details */
  selectedSponsor: Sponsor | null;
  
  /** Selected offer for details */
  selectedOffer: SponsorOffer | null;
  
  /** Selected contract for details */
  selectedContract: SponsorContract | null;
  
  /** Show negotiation modal */
  showNegotiationModal: boolean;
  
  /** Show offer details modal */
  showOfferDetailsModal: boolean;
  
  /** Show contract details modal */
  showContractDetailsModal: boolean;
}

interface UseSponsorSystemActions {
  /** Load sponsor record for character */
  loadSponsorRecord: (characterId: string) => Promise<void>;
  
  /** Get available sponsors */
  getAvailableSponsors: (characterId: string) => Promise<void>;
  
  /** Get available offers */
  getAvailableOffers: (characterId: string) => Promise<void>;
  
  /** Accept offer */
  acceptOffer: (offerId: string) => Promise<void>;
  
  /** Reject offer */
  rejectOffer: (offerId: string) => Promise<void>;
  
  /** Negotiate offer */
  negotiateOffer: (offerId: string, negotiationPoints: NegotiationPoints) => Promise<NegotiationResult>;
  
  /** Update contract progress */
  updateContractProgress: (contractId: string, progress: number) => Promise<void>;
  
  /** Cancel contract */
  cancelContract: (contractId: string, reason: string) => Promise<void>;
  
  /** Claim rewards */
  claimRewards: (contractId: string) => Promise<SponsorReward[]>;
  
  /** Get sponsor statistics */
  getSponsorStatistics: (characterId: string) => Promise<void>;
  
  /** Generate sponsor opportunities */
  generateSponsorOpportunities: (characterId: string) => Promise<void>;
  
  /** Get sponsor benefits */
  getSponsorBenefits: (characterId: string) => Promise<void>;
  
  /** Set selected sponsor */
  setSelectedSponsor: (sponsor: Sponsor | null) => void;
  
  /** Set selected offer */
  setSelectedOffer: (offer: SponsorOffer | null) => void;
  
  /** Set selected contract */
  setSelectedContract: (contract: SponsorContract | null) => void;
  
  /** Show/hide negotiation modal */
  setShowNegotiationModal: (show: boolean) => void;
  
  /** Show/hide offer details modal */
  setShowOfferDetailsModal: (show: boolean) => void;
  
  /** Show/hide contract details modal */
  setShowContractDetailsModal: (show: boolean) => void;
  
  /** Clear error */
  clearError: () => void;
  
  /** Refresh data */
  refreshData: () => Promise<void>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useSponsorSystem(
  character: Character,
  sponsorSystem: SponsorSystem
): UseSponsorSystemState & UseSponsorSystemActions {
  const [state, setState] = useState<UseSponsorSystemState>({
    sponsorRecord: null,
    isLoading: false,
    error: null,
    availableSponsors: [],
    availableOffers: [],
    activeContracts: [],
    contractHistory: [],
    sponsorStatistics: null,
    sponsorOpportunities: [],
    sponsorBenefits: [],
    selectedSponsor: null,
    selectedOffer: null,
    selectedContract: null,
    showNegotiationModal: false,
    showOfferDetailsModal: false,
    showContractDetailsModal: false,
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const loadSponsorRecord = useCallback(async (characterId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const sponsorRecord = await sponsorSystem.getSponsorRecord(characterId);
      
      setState(prev => ({
        ...prev,
        sponsorRecord,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sponsor record';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  // Load sponsor record when character changes
  useEffect(() => {
    if (character?.id) {
      loadSponsorRecord(character.id);
    }
  }, [character?.id, loadSponsorRecord]);

  // ============================================================================
  // SPONSOR MANAGEMENT
  // ============================================================================

  const getAvailableSponsors = useCallback(async (characterId: string) => {
    try {
      const sponsors = await sponsorSystem.getAvailableSponsors(characterId);
      
      setState(prev => ({ ...prev, availableSponsors: sponsors }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get available sponsors';
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  const getSponsorDetails = useCallback(async (characterId: string, sponsorId: string) => {
    try {
      const sponsor = await sponsorSystem.getSponsorDetails(characterId, sponsorId);
      return sponsor;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get sponsor details';
      toast.error(errorMessage);
      return null;
    }
  }, [sponsorSystem]);

  // ============================================================================
  // OFFER MANAGEMENT
  // ============================================================================

  const getAvailableOffers = useCallback(async (characterId: string) => {
    try {
      const offers = await sponsorSystem.getAvailableOffers(characterId);
      
      setState(prev => ({ ...prev, availableOffers: offers }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get available offers';
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  const acceptOffer = useCallback(async (offerId: string) => {
    if (!character?.id) {
      toast.error('No character selected');
      return;
    }

    try {
      const contract = await sponsorSystem.acceptOffer(character.id, offerId);
      
      // Refresh data
      await refreshData();
      
      toast.success(`Contract signed: ${contract.title}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept offer';
      toast.error(errorMessage);
    }
  }, [character?.id, sponsorSystem]);

  const rejectOffer = useCallback(async (offerId: string) => {
    if (!character?.id) {
      toast.error('No character selected');
      return;
    }

    try {
      await sponsorSystem.rejectOffer(character.id, offerId);
      
      // Refresh data
      await refreshData();
      
      toast.info('Offer rejected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject offer';
      toast.error(errorMessage);
    }
  }, [character?.id, sponsorSystem]);

  const negotiateOffer = useCallback(async (
    offerId: string, 
    negotiationPoints: NegotiationPoints
  ): Promise<NegotiationResult> => {
    if (!character?.id) {
      toast.error('No character selected');
      throw new Error('No character selected');
    }

    try {
      const result = await sponsorSystem.negotiateOffer(character.id, offerId, negotiationPoints);
      
      // Refresh data
      await refreshData();
      
      if (result.success) {
        toast.success('Negotiation successful! Better terms secured.');
      } else {
        toast.error('Negotiation failed. Original offer still available.');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to negotiate offer';
      toast.error(errorMessage);
      throw error;
    }
  }, [character?.id, sponsorSystem]);

  // ============================================================================
  // CONTRACT MANAGEMENT
  // ============================================================================

  const getActiveContracts = useCallback(async (characterId: string) => {
    try {
      const contracts = await sponsorSystem.getActiveContracts(characterId);
      
      setState(prev => ({ ...prev, activeContracts: contracts }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active contracts';
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  const getContractHistory = useCallback(async (characterId: string) => {
    try {
      const history = await sponsorSystem.getContractHistory(characterId);
      
      setState(prev => ({ ...prev, contractHistory: history }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get contract history';
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  const updateContractProgress = useCallback(async (contractId: string, progress: number) => {
    if (!character?.id) {
      toast.error('No character selected');
      return;
    }

    try {
      await sponsorSystem.updateContractProgress(character.id, contractId, progress);
      
      // Refresh data
      await refreshData();
      
      toast.success('Contract progress updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contract progress';
      toast.error(errorMessage);
    }
  }, [character?.id, sponsorSystem]);

  const cancelContract = useCallback(async (contractId: string, reason: string) => {
    if (!character?.id) {
      toast.error('No character selected');
      return;
    }

    try {
      await sponsorSystem.cancelContract(character.id, contractId, reason);
      
      // Refresh data
      await refreshData();
      
      toast.warning('Contract cancelled');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel contract';
      toast.error(errorMessage);
    }
  }, [character?.id, sponsorSystem]);

  const claimRewards = useCallback(async (contractId: string): Promise<SponsorReward[]> => {
    if (!character?.id) {
      toast.error('No character selected');
      throw new Error('No character selected');
    }

    try {
      const rewards = await sponsorSystem.claimRewards(character.id, contractId);
      
      // Refresh data
      await refreshData();
      
      toast.success(`Rewards claimed: ${rewards.length} items`);
      
      return rewards;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim rewards';
      toast.error(errorMessage);
      throw error;
    }
  }, [character?.id, sponsorSystem]);

  // ============================================================================
  // ANALYTICS AND STATISTICS
  // ============================================================================

  const getSponsorStatistics = useCallback(async (characterId: string) => {
    try {
      const statistics = await sponsorSystem.getSponsorStatistics(characterId);
      
      setState(prev => ({ ...prev, sponsorStatistics: statistics }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get sponsor statistics';
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  const generateSponsorOpportunities = useCallback(async (characterId: string) => {
    try {
      const opportunities = await sponsorSystem.generateSponsorOpportunities(characterId);
      
      setState(prev => ({ ...prev, sponsorOpportunities: opportunities }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate sponsor opportunities';
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  const getSponsorBenefits = useCallback(async (characterId: string) => {
    try {
      const benefits = await sponsorSystem.getSponsorBenefits(characterId);
      
      setState(prev => ({ ...prev, sponsorBenefits: benefits }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get sponsor benefits';
      toast.error(errorMessage);
    }
  }, [sponsorSystem]);

  // ============================================================================
  // UI STATE MANAGEMENT
  // ============================================================================

  const setSelectedSponsor = useCallback((sponsor: Sponsor | null) => {
    setState(prev => ({ ...prev, selectedSponsor: sponsor }));
  }, []);

  const setSelectedOffer = useCallback((offer: SponsorOffer | null) => {
    setState(prev => ({ ...prev, selectedOffer: offer }));
  }, []);

  const setSelectedContract = useCallback((contract: SponsorContract | null) => {
    setState(prev => ({ ...prev, selectedContract: contract }));
  }, []);

  const setShowNegotiationModal = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showNegotiationModal: show }));
  }, []);

  const setShowOfferDetailsModal = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showOfferDetailsModal: show }));
  }, []);

  const setShowContractDetailsModal = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showContractDetailsModal: show }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshData = useCallback(async () => {
    if (character?.id) {
      await Promise.all([
        loadSponsorRecord(character.id),
        getAvailableSponsors(character.id),
        getAvailableOffers(character.id),
        getActiveContracts(character.id),
        getContractHistory(character.id),
        getSponsorStatistics(character.id),
        generateSponsorOpportunities(character.id),
        getSponsorBenefits(character.id),
      ]);
    }
  }, [character?.id, loadSponsorRecord, getAvailableSponsors, getAvailableOffers, getActiveContracts, getContractHistory, getSponsorStatistics, generateSponsorOpportunities, getSponsorBenefits]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const sponsorSummary = useMemo(() => {
    if (!state.sponsorRecord) {
      return {
        totalSponsors: 0,
        activeContracts: 0,
        totalEarnings: 0,
        reputation: 50,
        topSponsor: null,
      };
    }

    return {
      totalSponsors: state.sponsorRecord.sponsors?.length || 0,
      activeContracts: state.activeContracts.length,
      totalEarnings: state.sponsorRecord.totalEarnings || 0,
      reputation: state.sponsorRecord.reputation || 50,
      topSponsor: state.sponsorStatistics?.topSponsor || null,
    };
  }, [state.sponsorRecord, state.activeContracts, state.sponsorStatistics]);

  const urgentOffers = useMemo(() => {
    return state.availableOffers.filter(offer => isOfferExpiringSoon(offer));
  }, [state.availableOffers]);

  const highValueOffers = useMemo(() => {
    return state.availableOffers
      .map(offer => ({
        offer,
        value: calculateOfferValue(offer),
      }))
      .filter(({ value }) => value > 2000)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [state.availableOffers]);

  const expiringContracts = useMemo(() => {
    const now = new Date();
    return state.activeContracts.filter(contract => {
      const timeUntilExpiry = contract.endDate.getTime() - now.getTime();
      return timeUntilExpiry < 3 * 24 * 60 * 60 * 1000; // Less than 3 days
    });
  }, [state.activeContracts]);

  const completedContracts = useMemo(() => {
    return state.contractHistory.filter(contract => contract.completed);
  }, [state.contractHistory]);

  const cancelledContracts = useMemo(() => {
    return state.contractHistory.filter(contract => contract.status === 'cancelled');
  }, [state.contractHistory]);

  const sponsorTierDistribution = useMemo(() => {
    const distribution: Record<SponsorTier, number> = {
      elite: 0,
      premium: 0,
      standard: 0,
      local: 0,
    };

    state.sponsorRecord?.sponsors?.forEach(sponsor => {
      const sponsorData = PUNCH_CLUB_SPONSOR_CONFIG.sponsors.find(s => s.id === sponsor.sponsorId);
      if (sponsorData) {
        distribution[sponsorData.tier]++;
      }
    });

    return distribution;
  }, [state.sponsorRecord]);

  const sponsorCategoryDistribution = useMemo(() => {
    const distribution: Record<SponsorCategory, number> = {
      sports: 0,
      nutrition: 0,
      equipment: 0,
      media: 0,
      healthcare: 0,
      finance: 0,
      entertainment: 0,
      technology: 0,
    };

    state.sponsorRecord?.sponsors?.forEach(sponsor => {
      const sponsorData = PUNCH_CLUB_SPONSOR_CONFIG.sponsors.find(s => s.id === sponsor.sponsorId);
      if (sponsorData) {
        distribution[sponsorData.category]++;
      }
    });

    return distribution;
  }, [state.sponsorRecord]);

  const canNegotiate = useMemo(() => {
    return character?.level >= 3 && (state.sponsorRecord?.reputation || 0) >= 30;
  }, [character?.level, state.sponsorRecord]);

  const maxContracts = useMemo(() => {
    return PUNCH_CLUB_SPONSOR_CONFIG.contractConfig.maxActiveContracts;
  }, []);

  const hasContractSlots = useMemo(() => {
    return state.activeContracts.length < maxContracts;
  }, [state.activeContracts, maxContracts]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getSponsorTierColor = useCallback((tier: SponsorTier): string => {
    const colors = {
      elite: 'text-purple-500',
      premium: 'text-blue-500',
      standard: 'text-green-500',
      local: 'text-gray-500',
    };
    return colors[tier];
  }, []);

  const getOfferUrgencyColor = useCallback((offer: SponsorOffer): string => {
    const urgency = getOfferUrgencyLevel(offer);
    const colors = {
      low: 'text-green-500',
      medium: 'text-yellow-500',
      high: 'text-orange-500',
      critical: 'text-red-500',
    };
    return colors[urgency];
  }, []);

  const getContractStatusColor = useCallback((status: string): string => {
    const colors = {
      active: 'text-green-500',
      completed: 'text-blue-500',
      cancelled: 'text-red-500',
      expired: 'text-gray-500',
    };
    return colors[status as keyof typeof colors] || 'text-gray-500';
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDuration = useCallback((days: number): string => {
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days === 7) return '1 week';
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days === 30) return '1 month';
    return `${Math.floor(days / 30)} months`;
  }, []);

  const getTimeUntilExpiry = useCallback((endDate: Date): string => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return '< 1h';
    }
  }, []);

  // ============================================================================
  // RETURN STATE AND ACTIONS
  // ============================================================================

  return {
    ...state,
    sponsorSummary,
    urgentOffers,
    highValueOffers,
    expiringContracts,
    completedContracts,
    cancelledContracts,
    sponsorTierDistribution,
    sponsorCategoryDistribution,
    canNegotiate,
    maxContracts,
    hasContractSlots,
    loadSponsorRecord,
    getAvailableSponsors,
    getAvailableOffers,
    acceptOffer,
    rejectOffer,
    negotiateOffer,
    updateContractProgress,
    cancelContract,
    claimRewards,
    getSponsorStatistics,
    generateSponsorOpportunities,
    getSponsorBenefits,
    setSelectedSponsor,
    setSelectedOffer,
    setSelectedContract,
    setShowNegotiationModal,
    setShowOfferDetailsModal,
    setShowContractDetailsModal,
    clearError,
    refreshData,
    // Utility functions
    getSponsorTierColor,
    getOfferUrgencyColor,
    getContractStatusColor,
    formatCurrency,
    formatDuration,
    getTimeUntilExpiry,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for getting sponsor tier options
 */
export function useSponsorTiers() {
  return useMemo(() => {
    const tiers: SponsorTier[] = ['elite', 'premium', 'standard', 'local'];
    
    return tiers.map(tier => ({
      id: tier,
      name: getSponsorTierDisplayName(tier),
      color: getSponsorTierColor(tier),
    }));
  }, []);
}

/**
 * Hook for getting sponsor category options
 */
export function useSponsorCategories() {
  return useMemo(() => {
    const categories: SponsorCategory[] = [
      'sports', 'nutrition', 'equipment', 'media', 'healthcare', 'finance', 'entertainment', 'technology'
    ];
    
    return categories.map(category => ({
      id: category,
      name: getSponsorCategoryDisplayName(category),
    }));
  }, []);
}

/**
 * Hook for getting offer type options
 */
export function useOfferTypes() {
  return useMemo(() => {
    const types = ['championship', 'exclusive', 'endorsement', 'training', 'facility', 'promotion', 'local_business', 'food_sponsorship'];
    
    return types.map(type => ({
      id: type,
      name: getOfferTypeDisplayName(type),
    }));
  }, []);
}

/**
 * Hook for getting reward type options
 */
export function useRewardTypes() {
  return useMemo(() => {
    const types = ['money', 'energy_boost', 'reputation', 'equipment', 'training_bonus', 'recovery_bonus', 'free_products'];
    
    return types.map(type => ({
      id: type,
      name: getRewardTypeDisplayName(type),
    }));
  }, []);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSponsorTierColor(tier: SponsorTier): string {
  const colors = {
    elite: 'bg-purple-500',
    premium: 'bg-blue-500',
    standard: 'bg-green-500',
    local: 'bg-gray-500',
  };
  return colors[tier];
}
