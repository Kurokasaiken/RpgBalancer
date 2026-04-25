/**
 * Gym Management System
 * 
 * Comprehensive gym management system for Punch Club with staff scheduling,
 * equipment upgrades, maintenance scheduling, and facility management.
 * 
 * Features:
 * - Staff management with roles and scheduling
 * - Equipment upgrades and maintenance
 * - Facility expansion and management
 * - Member management and training programs
 * - Financial tracking and optimization
 * - Performance analytics and reporting
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const gymDiagnostics = createHeadlessDiagnostics('GymManagement');

/**
 * Staff role definitions
 */
export interface StaffRole {
  id: string;
  name: string;
  description: string;
  baseSalary: number;
  requiredSkills: string[];
  responsibilities: string[];
  maxHoursPerWeek: number;
  efficiency: number; // 0-1 multiplier
}

/**
 * Staff member information
 */
export interface StaffMember {
  id: string;
  name: string;
  roleId: string;
  level: number;
  experience: number;
  skills: Record<string, number>;
  availability: {
    monday: boolean[];
    tuesday: boolean[];
    wednesday: boolean[];
    thursday: boolean[];
    friday: boolean[];
    saturday: boolean[];
    sunday: boolean[];
  };
  currentSchedule: StaffSchedule[];
  performance: {
    rating: number; // 1-5
    memberSatisfaction: number; // 0-1
    retentionRate: number; // 0-1
    classesPerWeek: number;
  };
  hireDate: number;
  salary: number;
  status: 'active' | 'on_leave' | 'terminated';
}

/**
 * Staff schedule entry
 */
export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0-6 (Sunday = 0)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  role: string; // trainer, receptionist, cleaner, etc.
  area: string; // specific gym area
}

/**
 * Equipment definitions
 */
export interface Equipment {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'functional' | 'recovery' | 'admin';
  purchaseDate: number;
  purchaseCost: number;
  currentValue: number;
  condition: number; // 0-1 (0 = broken, 1 = new)
  maintenanceInterval: number; // days
  lastMaintenance: number;
  nextMaintenance: number;
  usage: {
    totalHours: number;
    weeklyHours: number;
    monthlyHours: number;
  };
  location: string;
  specifications: Record<string, any>;
}

/**
 * Equipment upgrade options
 */
export interface EquipmentUpgrade {
  id: string;
  equipmentId: string;
  name: string;
  description: string;
  cost: number;
  duration: number; // hours for installation
  benefits: {
    efficiency: number; // 0-1 improvement
    durability: number; // 0-1 improvement
    userExperience: number; // 0-1 improvement
    capacity?: number; // increased capacity
  };
  requirements: {
    staffLevel?: number;
    facilityLevel?: number;
    prerequisites?: string[];
  };
}

/**
 * Facility area definitions
 */
export interface FacilityArea {
  id: string;
  name: string;
  type: 'weight_room' | 'cardio_area' | 'studio' | 'locker_room' | 'reception' | 'office' | 'storage';
  size: number; // square meters
  capacity: number; // max occupants
  equipment: string[]; // equipment IDs
  amenities: string[];
  condition: number; // 0-1
  upgradeLevel: number; // 0-5
  monthlyCost: number;
  revenue: number;
}

/**
 * Maintenance schedule
 */
export interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  scheduledDate: number;
  duration: number; // hours
  assignedStaffId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  cost: number;
  notes?: string;
}

/**
 * Training program definitions
 */
export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'rehabilitation';
  duration: number; // minutes
  difficulty: number; // 1-5
  maxParticipants: number;
  requiredEquipment: string[];
  requiredSkills: string[];
  price: number;
  revenue: number;
  popularity: number; // 0-1
  rating: number; // 1-5
}

/**
 * Gym member information
 */
export interface GymMember {
  id: string;
  name: string;
  joinDate: number;
  membershipType: 'basic' | 'premium' | 'vip';
  membershipStatus: 'active' | 'expired' | 'suspended' | 'cancelled';
  monthlyFee: number;
  attendance: {
    visitsThisMonth: number;
    visitsLastMonth: number;
    averageVisitsPerWeek: number;
    favoriteClasses: string[];
    favoriteEquipment: string[];
  };
  fitness: {
    level: number; // 1-10
    goals: string[];
    achievements: string[];
    personalRecords: Record<string, number>;
  };
  payments: {
    lastPayment: number;
    nextPayment: number;
    outstandingBalance: number;
    paymentMethod: string;
  };
}

/**
 * Gym financial data
 */
export interface GymFinances {
  revenue: {
    membership: number;
    personalTraining: number;
    classes: number;
    merchandise: number;
    other: number;
  };
  expenses: {
    staff: number;
    maintenance: number;
    utilities: number;
    equipment: number;
    marketing: number;
    other: number;
  };
  profit: number;
  profitMargin: number;
  cashFlow: number;
  outstandingInvoices: number;
}

/**
 * Gym performance metrics
 */
export interface GymMetrics {
  occupancy: {
    current: number;
    capacity: number;
    peakHours: number[];
    averageOccupancy: number;
  };
  staff: {
    totalStaff: number;
    staffPerMember: number;
    averageRating: number;
    turnoverRate: number;
  };
  equipment: {
    totalEquipment: number;
    averageCondition: number;
    maintenanceOverdue: number;
    utilizationRate: number;
  };
  members: {
    totalMembers: number;
    newMembersThisMonth: number;
    churnRate: number;
    retentionRate: number;
    satisfactionScore: number;
  };
  financial: {
    revenuePerMember: number;
    costPerMember: number;
    profitPerMember: number;
    monthlyGrowth: number;
  };
}

/**
 * Gym management configuration
 */
export interface GymConfig {
  business: {
    name: string;
    type: 'commercial' | 'corporate' | 'community' | 'specialized';
    targetMarket: string[];
    operatingHours: {
      monday: { open: string; close: string };
      tuesday: { open: string; close: string };
      wednesday: { open: string; close: string };
      thursday: { open: string; close: string };
      friday: { open: string; close: string };
      saturday: { open: string; close: string };
      sunday: { open: string; close: string };
    };
  };
  facilities: {
    totalSize: number; // square meters
    maxCapacity: number;
    parkingSpaces: number;
    lockerRooms: number;
    showers: number;
    studios: number;
  };
  services: {
    personalTraining: boolean;
    groupClasses: boolean;
    nutritionCoaching: boolean;
    physicalTherapy: boolean;
    childCare: boolean;
    sauna: boolean;
    pool: boolean;
  };
  pricing: {
    basicMembership: number;
    premiumMembership: number;
    vipMembership: number;
    personalTrainingRate: number;
    classRate: number;
    guestFee: number;
  };
  policies: {
    cancellationPeriod: number; // hours
    noShowFee: number;
    lateFee: number;
    freezePolicy: string;
    refundPolicy: string;
  };
}

/**
 * Main gym management state
 */
export interface GymState {
  config: GymConfig;
  staff: Record<string, StaffMember>;
  equipment: Record<string, Equipment>;
  areas: Record<string, FacilityArea>;
  schedules: Record<string, StaffSchedule>;
  maintenance: Record<string, MaintenanceSchedule>;
  upgrades: Record<string, EquipmentUpgrade>;
  programs: Record<string, TrainingProgram>;
  members: Record<string, GymMember>;
  finances: GymFinances;
  metrics: GymMetrics;
  lastUpdated: number;
}

/**
 * Default gym configuration
 */
export const DEFAULT_GYM_CONFIG: GymConfig = {
  business: {
    name: 'Punch Club Gym',
    type: 'commercial',
    targetMarket: ['fitness_enthusiasts', 'athletes', 'general_fitness'],
    operatingHours: {
      monday: { open: '05:00', close: '23:00' },
      tuesday: { open: '05:00', close: '23:00' },
      wednesday: { open: '05:00', close: '23:00' },
      thursday: { open: '05:00', close: '23:00' },
      friday: { open: '05:00', close: '22:00' },
      saturday: { open: '06:00', close: '20:00' },
      sunday: { open: '07:00', close: '19:00' },
    },
  },
  facilities: {
    totalSize: 1000, // square meters
    maxCapacity: 150,
    parkingSpaces: 50,
    lockerRooms: 2,
    showers: 8,
    studios: 3,
  },
  services: {
    personalTraining: true,
    groupClasses: true,
    nutritionCoaching: false,
    physicalTherapy: false,
    childCare: false,
    sauna: false,
    pool: false,
  },
  pricing: {
    basicMembership: 29.99,
    premiumMembership: 49.99,
    vipMembership: 99.99,
    personalTrainingRate: 60.00,
    classRate: 15.00,
    guestFee: 10.00,
  },
  policies: {
    cancellationPeriod: 24,
    noShowFee: 15.00,
    lateFee: 5.00,
    freezePolicy: 'Maximum 3 months per year',
    refundPolicy: 'Pro-rated refund for unused months',
  },
};

/**
 * Default staff roles
 */
export const DEFAULT_STAFF_ROLES: Record<string, StaffRole> = {
  trainer: {
    id: 'trainer',
    name: 'Personal Trainer',
    description: 'Provides one-on-one training and group instruction',
    baseSalary: 45000,
    requiredSkills: ['fitness_training', 'nutrition', 'cpr'],
    responsibilities: ['personal_training', 'group_classes', 'member_assessment'],
    maxHoursPerWeek: 40,
    efficiency: 0.8,
  },
  receptionist: {
    id: 'receptionist',
    name: 'Front Desk Receptionist',
    description: 'Manages member check-in, billing, and customer service',
    baseSalary: 32000,
    requiredSkills: ['customer_service', 'basic_computer', 'cash_handling'],
    responsibilities: ['member_checkin', 'billing', 'customer_service', 'phone_calls'],
    maxHoursPerWeek: 40,
    efficiency: 0.9,
  },
  cleaner: {
    id: 'cleaner',
    name: 'Maintenance Staff',
    description: 'Maintains facility cleanliness and equipment maintenance',
    baseSalary: 28000,
    requiredSkills: ['cleaning', 'basic_maintenance', 'safety'],
    responsibilities: ['facility_cleaning', 'equipment_maintenance', 'safety_checks'],
    maxHoursPerWeek: 40,
    efficiency: 0.85,
  },
  manager: {
    id: 'manager',
    name: 'Gym Manager',
    description: 'Oversees all gym operations and staff management',
    baseSalary: 65000,
    requiredSkills: ['management', 'finance', 'customer_service', 'marketing'],
    responsibilities: ['staff_management', 'financial_overview', 'marketing', 'member_relations'],
    maxHoursPerWeek: 45,
    efficiency: 0.95,
  },
};

/**
 * Gym Management Service
 */
export class GymManagementService {
  private state: GymState;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(initialState?: Partial<GymState>) {
    this.state = {
      config: DEFAULT_GYM_CONFIG,
      staff: {},
      equipment: {},
      areas: {},
      schedules: {},
      maintenance: {},
      upgrades: {},
      programs: {},
      members: {},
      finances: {
        revenue: { membership: 0, personalTraining: 0, classes: 0, merchandise: 0, other: 0 },
        expenses: { staff: 0, maintenance: 0, utilities: 0, equipment: 0, marketing: 0, other: 0 },
        profit: 0,
        profitMargin: 0,
        cashFlow: 0,
        outstandingInvoices: 0,
      },
      metrics: {
        occupancy: { current: 0, capacity: 0, peakHours: [], averageOccupancy: 0 },
        staff: { totalStaff: 0, staffPerMember: 0, averageRating: 0, turnoverRate: 0 },
        equipment: { totalEquipment: 0, averageCondition: 0, maintenanceOverdue: 0, utilizationRate: 0 },
        members: { totalMembers: 0, newMembersThisMonth: 0, churnRate: 0, retentionRate: 0, satisfactionScore: 0 },
        financial: { revenuePerMember: 0, costPerMember: 0, profitPerMember: 0, monthlyGrowth: 0 },
      },
      lastUpdated: Date.now(),
      ...initialState,
    };

    this.startAutoSave();
    gymDiagnostics.log('GymManagementService initialized', {
      gymName: this.state.config.business.name,
      totalStaff: Object.keys(this.state.staff).length,
      totalEquipment: Object.keys(this.state.equipment).length,
    });
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveState();
    }, 30000); // Save every 30 seconds
  }

  /**
   * Save current state to persistent storage
   */
  private async saveState(): Promise<void> {
    try {
      this.state.lastUpdated = Date.now();
      await saveData('gym_management_state', this.state);
      gymDiagnostics.log('State saved successfully');
    } catch (error) {
      gymDiagnostics.error('Failed to save state', error);
    }
  }

  /**
   * Load state from persistent storage
   */
  async loadState(): Promise<void> {
    try {
      const savedState = await loadData('gym_management_state', this.state);
      this.state = { ...this.state, ...savedState };
      gymDiagnostics.log('State loaded successfully', {
        lastUpdated: this.state.lastUpdated,
      });
    } catch (error) {
      gymDiagnostics.error('Failed to load state', error);
    }
  }

  /**
   * Get current gym state
   */
  getState(): GymState {
    return { ...this.state };
  }

  /**
   * Update gym configuration
   */
  updateConfig(configUpdates: Partial<GymConfig>): void {
    this.state.config = { ...this.state.config, ...configUpdates };
    this.calculateMetrics();
    gymDiagnostics.log('Configuration updated', { updates: Object.keys(configUpdates) });
  }

  /**
   * Add new staff member
   */
  addStaffMember(staffMember: Omit<StaffMember, 'id'>): string {
    const id = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newStaff: StaffMember = { ...staffMember, id };

    this.state.staff[id] = newStaff;
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Staff member added', { id, name: staffMember.name, role: staffMember.roleId });
    return id;
  }

  /**
   * Update staff member
   */
  updateStaffMember(id: string, updates: Partial<StaffMember>): boolean {
    if (!this.state.staff[id]) {
      gymDiagnostics.warn('Staff member not found', { id });
      return false;
    }

    this.state.staff[id] = { ...this.state.staff[id], ...updates };
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Staff member updated', { id, updates: Object.keys(updates) });
    return true;
  }

  /**
   * Remove staff member
   */
  removeStaffMember(id: string): boolean {
    if (!this.state.staff[id]) {
      gymDiagnostics.warn('Staff member not found', { id });
      return false;
    }

    // Remove associated schedules
    Object.keys(this.state.schedules).forEach(scheduleId => {
      if (this.state.schedules[scheduleId].staffId === id) {
        delete this.state.schedules[scheduleId];
      }
    });

    delete this.state.staff[id];
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Staff member removed', { id });
    return true;
  }

  /**
   * Add staff schedule
   */
  addStaffSchedule(schedule: StaffSchedule): string {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state.schedules[id] = { ...schedule, id };
    this.saveState();

    gymDiagnostics.log('Staff schedule added', { id, staffId: schedule.staffId });
    return id;
  }

  /**
   * Get staff schedules for a specific week
   */
  getStaffSchedules(weekStart: Date): StaffSchedule[] {
    return Object.values(this.state.schedules).filter(schedule => {
      const scheduleDate = new Date(schedule.startTime);
      return this.isSameWeek(scheduleDate, weekStart);
    });
  }

  /**
   * Add new equipment
   */
  addEquipment(equipment: Omit<Equipment, 'id'>): string {
    const id = `equipment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEquipment: Equipment = { ...equipment, id };

    this.state.equipment[id] = newEquipment;
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Equipment added', { id, name: equipment.name, category: equipment.category });
    return id;
  }

  /**
   * Update equipment
   */
  updateEquipment(id: string, updates: Partial<Equipment>): boolean {
    if (!this.state.equipment[id]) {
      gymDiagnostics.warn('Equipment not found', { id });
      return false;
    }

    this.state.equipment[id] = { ...this.state.equipment[id], ...updates };
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Equipment updated', { id, updates: Object.keys(updates) });
    return true;
  }

  /**
   * Schedule equipment maintenance
   */
  scheduleMaintenance(maintenance: Omit<MaintenanceSchedule, 'id'>): string {
    const id = `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state.maintenance[id] = { ...maintenance, id };
    this.saveState();

    gymDiagnostics.log('Maintenance scheduled', { id, equipmentId: maintenance.equipmentId });
    return id;
  }

  /**
   * Get overdue maintenance
   */
  getOverdueMaintenance(): MaintenanceSchedule[] {
    const now = Date.now();
    return Object.values(this.state.maintenance).filter(
      maintenance => maintenance.scheduledDate < now && maintenance.status !== 'completed'
    );
  }

  /**
   * Add facility area
   */
  addFacilityArea(area: Omit<FacilityArea, 'id'>): string {
    const id = `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state.areas[id] = { ...area, id };
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Facility area added', { id, name: area.name, type: area.type });
    return id;
  }

  /**
   * Upgrade equipment
   */
  upgradeEquipment(equipmentId: string, upgradeId: string): boolean {
    const equipment = this.state.equipment[equipmentId];
    const upgrade = this.state.upgrades[upgradeId];

    if (!equipment || !upgrade) {
      gymDiagnostics.warn('Equipment or upgrade not found', { equipmentId, upgradeId });
      return false;
    }

    // Apply upgrade benefits
    equipment.condition = Math.min(1, equipment.condition + upgrade.benefits.durability);
    equipment.currentValue += upgrade.cost * 0.7; // Upgrade adds value

    // Remove upgrade from available upgrades
    delete this.state.upgrades[upgradeId];

    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Equipment upgraded', { equipmentId, upgradeId });
    return true;
  }

  /**
   * Add gym member
   */
  addMember(member: Omit<GymMember, 'id'>): string {
    const id = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMember: GymMember = { ...member, id };

    this.state.members[id] = newMember;
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Member added', { id, name: member.name, membershipType: member.membershipType });
    return id;
  }

  /**
   * Update member information
   */
  updateMember(id: string, updates: Partial<GymMember>): boolean {
    if (!this.state.members[id]) {
      gymDiagnostics.warn('Member not found', { id });
      return false;
    }

    this.state.members[id] = { ...this.state.members[id], ...updates };
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Member updated', { id, updates: Object.keys(updates) });
    return true;
  }

  /**
   * Calculate gym metrics
   */
  private calculateMetrics(): void {
    const staff = Object.values(this.state.staff);
    const equipment = Object.values(this.state.equipment);
    const members = Object.values(this.state.members);
    const areas = Object.values(this.state.areas);

    // Staff metrics
    this.state.metrics.staff = {
      totalStaff: staff.length,
      staffPerMember: members.length > 0 ? staff.length / members.length : 0,
      averageRating: staff.length > 0 
        ? staff.reduce((sum, s) => sum + s.performance.rating, 0) / staff.length 
        : 0,
      turnoverRate: this.calculateTurnoverRate(staff),
    };

    // Equipment metrics
    this.state.metrics.equipment = {
      totalEquipment: equipment.length,
      averageCondition: equipment.length > 0 
        ? equipment.reduce((sum, e) => sum + e.condition, 0) / equipment.length 
        : 0,
      maintenanceOverdue: this.getOverdueMaintenance().length,
      utilizationRate: this.calculateEquipmentUtilization(equipment),
    };

    // Member metrics
    this.state.metrics.members = {
      totalMembers: members.length,
      newMembersThisMonth: this.getNewMembersThisMonth(members),
      churnRate: this.calculateChurnRate(members),
      retentionRate: this.calculateRetentionRate(members),
      satisfactionScore: this.calculateSatisfactionScore(members),
    };

    // Financial metrics
    this.state.metrics.financial = {
      revenuePerMember: members.length > 0 ? this.state.finances.profit / members.length : 0,
      costPerMember: members.length > 0 
        ? Object.values(this.state.finances.expenses).reduce((sum, val) => sum + val, 0) / members.length 
        : 0,
      profitPerMember: members.length > 0 ? this.state.finances.profit / members.length : 0,
      monthlyGrowth: this.calculateMonthlyGrowth(),
    };

    // Occupancy metrics
    this.state.metrics.occupancy = {
      current: this.calculateCurrentOccupancy(),
      capacity: this.state.config.facilities.maxCapacity,
      peakHours: this.getPeakHours(),
      averageOccupancy: this.calculateAverageOccupancy(),
    };
  }

  /**
   * Helper methods for metrics calculation
   */
  private calculateTurnoverRate(staff: StaffMember[]): number {
    const activeStaff = staff.filter(s => s.status === 'active');
    if (activeStaff.length === 0) return 0;

    const terminatedStaff = staff.filter(s => s.status === 'terminated');
    return terminatedStaff.length / activeStaff.length;
  }

  private calculateEquipmentUtilization(equipment: Equipment[]): number {
    if (equipment.length === 0) return 0;

    const totalUsage = equipment.reduce((sum, e) => sum + e.usage.weeklyHours, 0);
    const maxPossibleUsage = equipment.length * 40 * 7; // 40 hours/day, 7 days/week
    return totalUsage / maxPossibleUsage;
  }

  private getNewMembersThisMonth(members: GymMember[]): number {
    const thisMonth = new Date();
    const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    return members.filter(m => m.joinDate >= thisMonthStart.getTime()).length;
  }

  private calculateChurnRate(members: GymMember[]): number {
    const activeMembers = members.filter(m => m.membershipStatus === 'active');
    if (activeMembers.length === 0) return 0;

    const churnedMembers = members.filter(m => 
      m.membershipStatus === 'cancelled' || m.membershipStatus === 'expired'
    );
    return churnedMembers.length / activeMembers.length;
  }

  private calculateRetentionRate(members: GymMember[]): number {
    return 1 - this.calculateChurnRate(members);
  }

  private calculateSatisfactionScore(members: GymMember[]): number {
    const activeMembers = members.filter(m => m.membershipStatus === 'active');
    if (activeMembers.length === 0) return 0;

    // Simplified satisfaction calculation based on attendance and membership type
    return activeMembers.reduce((sum, m) => {
      const attendanceScore = Math.min(1, m.attendance.averageVisitsPerWeek / 3);
      const membershipScore = m.membershipType === 'vip' ? 1 : m.membershipType === 'premium' ? 0.8 : 0.6;
      return sum + (attendanceScore * 0.7 + membershipScore * 0.3);
    }, 0) / activeMembers.length;
  }

  private calculateMonthlyGrowth(): number {
    // Simplified growth calculation based on new members vs churn
    const newMembers = this.state.metrics.members.newMembersThisMonth;
    const totalMembers = this.state.metrics.members.totalMembers;
    return totalMembers > 0 ? (newMembers / totalMembers) * 100 : 0;
  }

  private calculateCurrentOccupancy(): number {
    // Simplified current occupancy calculation
    const activeMembers = Object.values(this.state.members).filter(m => m.membershipStatus === 'active');
    const peakHours = [7, 8, 17, 18, 19]; // 7-8am and 5-7pm
    
    const currentHour = new Date().getHours();
    const isPeakHour = peakHours.includes(currentHour);
    
    // Assume 30% of active members are present during peak hours, 10% otherwise
    const occupancyRate = isPeakHour ? 0.3 : 0.1;
    return Math.floor(activeMembers.length * occupancyRate);
  }

  private getPeakHours(): number[] {
    return [7, 8, 17, 18, 19]; // 7-8am and 5-7pm
  }

  private calculateAverageOccupancy(): number {
    // Simplified average occupancy calculation
    const activeMembers = Object.values(this.state.members).filter(m => m.membershipStatus === 'active');
    return Math.floor(activeMembers.length * 0.15); // 15% average occupancy
  }

  /**
   * Update financial data
   */
  updateFinancials(financialUpdates: Partial<GymFinances>): void {
    this.state.finances = { ...this.state.finances, ...financialUpdates };
    this.calculateMetrics();
    this.saveState();

    gymDiagnostics.log('Financials updated', { updates: Object.keys(financialUpdates) });
  }

  /**
   * Generate financial report
   */
  generateFinancialReport(): {
    summary: GymFinances;
    monthlyTrend: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
    recommendations: string[];
  } {
    const { finances, metrics } = this.state;

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (metrics.members.churnRate > 0.1) {
      recommendations.push('Consider implementing member retention programs to reduce churn rate');
    }

    if (metrics.equipment.maintenanceOverdue > 5) {
      recommendations.push('Schedule overdue equipment maintenance to ensure safety and functionality');
    }

    if (metrics.staff.averageRating < 3.5) {
      recommendations.push('Invest in staff training and development to improve service quality');
    }

    if (finances.profitMargin < 0.1) {
      recommendations.push('Review pricing strategy and cost structure to improve profitability');
    }

    if (metrics.occupancy.averageOccupancy < metrics.occupancy.capacity * 0.5) {
      recommendations.push('Implement marketing initiatives to increase gym utilization');
    }

    return {
      summary: finances,
      monthlyTrend: this.generateMonthlyTrend(),
      recommendations,
    };
  }

  /**
   * Generate monthly trend data (simplified)
   */
  private generateMonthlyTrend(): Array<{ month: string; revenue: number; expenses: number; profit: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseRevenue = this.state.finances.revenue.membership + this.state.finances.revenue.personalTraining;
    const baseExpenses = Object.values(this.state.finances.expenses).reduce((sum, val) => sum + val, 0);

    return months.map((month, index) => ({
      month,
      revenue: baseRevenue * (1 + index * 0.05), // 5% growth per month
      expenses: baseExpenses * (1 + index * 0.02), // 2% expense growth per month
      profit: (baseRevenue * (1 + index * 0.05)) - (baseExpenses * (1 + index * 0.02)),
    }));
  }

  /**
   * Check if two dates are in the same week
   */
  private isSameWeek(date1: Date, date2: Date): boolean {
    const startOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const week1 = startOfWeek(date1);
    const week2 = startOfWeek(date2);

    return week1.getTime() === week2.getTime();
  }

  /**
   * Get staff availability for a specific time slot
   */
  getStaffAvailability(dayOfWeek: number, startTime: string, endTime: string): StaffMember[] {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return Object.values(this.state.staff).filter(staff => {
      if (staff.status !== 'active') return false;

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const availability = staff.availability[dayName as keyof typeof staff.availability];

      // Check if staff is available during the entire time slot
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const halfHourIndex = Math.floor(minutes / 30);
        if (!availability[halfHourIndex]) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generate staff schedule recommendations
   */
  generateScheduleRecommendations(): {
    understaffed: Array<{ day: number; time: string; needed: number; available: number }>;
    overstaffed: Array<{ day: number; time: string; current: number; recommended: number }>;
    suggestions: string[];
  } {
    const recommendations = {
      understaffed: [] as Array<{ day: number; time: string; needed: number; available: number }>,
      overstaffed: [] as Array<{ day: number; time: string; current: number; recommended: number }>,
      suggestions: [] as string[],
    };

    // Analyze each day of the week
    for (let day = 0; day < 7; day++) {
      // Check peak hours (7-9am and 5-7pm)
      const peakSlots = [
        { start: '07:00', end: '09:00' },
        { start: '17:00', end: '19:00' },
      ];

      peakSlots.forEach(slot => {
        const available = this.getStaffAvailability(day, slot.start, slot.end).length;
        const needed = Math.ceil(this.state.metrics.occupancy.capacity * 0.3 / 10); // 1 staff per 10 members during peak

        if (available < needed) {
          recommendations.understaffed.push({
            day,
            time: `${slot.start}-${slot.end}`,
            needed,
            available,
          });
        } else if (available > needed * 1.5) {
          recommendations.overstaffed.push({
            day,
            time: `${slot.start}-${slot.end}`,
            current: available,
            recommended: needed,
          });
        }
      });
    }

    // Generate suggestions
    if (recommendations.understaffed.length > 0) {
      recommendations.suggestions.push('Consider hiring part-time staff for peak hours');
    }

    if (recommendations.overstaffed.length > 0) {
      recommendations.suggestions.push('Optimize staff scheduling to reduce overstaffing during off-peak hours');
    }

    if (this.state.metrics.staff.turnoverRate > 0.2) {
      recommendations.suggestions.push('Implement staff retention programs to reduce turnover');
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    this.saveState();
    gymDiagnostics.log('GymManagementService cleaned up');
  }
}

/**
 * Global gym management service instance
 */
let globalGymService: GymManagementService | null = null;

/**
 * Get or create global gym management service
 */
export function getGymManagementService(): GymManagementService {
  if (!globalGymService) {
    globalGymService = new GymManagementService();
  }
  return globalGymService;
}

/**
 * Initialize gym management service with optional initial state
 */
export function initializeGymManagement(initialState?: Partial<GymState>): GymManagementService {
  const service = new GymManagementService(initialState);
  service.loadState();
  return service;
}

/**
 * Cleanup global gym management service
 */
export function cleanupGymManagement(): void {
  if (globalGymService) {
    globalGymService.cleanup();
    globalGymService = null;
  }
}
