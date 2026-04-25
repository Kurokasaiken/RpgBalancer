/**
 * Gym Management System Tests
 * 
 * Comprehensive test suite for gym management functionality
 * including staff management, equipment maintenance, scheduling,
 * and financial tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  GymManagementService, 
  getGymManagementService, 
  initializeGymManagement, 
  cleanupGymManagement,
  DEFAULT_GYM_CONFIG,
  DEFAULT_STAFF_ROLES,
  type GymState,
  type StaffMember,
  type Equipment,
  type GymMember,
} from '@/shared/gym/gymManagement';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

describe('GymManagementService', () => {
  let gymService: GymManagementService;
  let mockSaveData: vi.MockedFunction<typeof import('@/shared/persistence/PersistenceService').saveData>;
  let mockLoadData: vi.MockedFunction<typeof import('@/shared/persistence/PersistenceService').loadData>;

  // Sample data for testing
  const sampleStaffMember: Omit<StaffMember, 'id'> = {
    name: 'John Trainer',
    roleId: 'trainer',
    level: 3,
    experience: 1500,
    skills: { fitness_training: 8, nutrition: 6, cpr: 5 },
    availability: {
      monday: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      tuesday: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      wednesday: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      thursday: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      friday: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      saturday: [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      sunday: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    },
    currentSchedule: [],
    performance: {
      rating: 4.5,
      memberSatisfaction: 0.85,
      retentionRate: 0.92,
      classesPerWeek: 12,
    },
    hireDate: Date.now() - 86400000 * 365, // 1 year ago
    salary: 45000,
    status: 'active',
  };

  const sampleEquipment: Omit<Equipment, 'id'> = {
    name: 'Treadmill Pro X1',
    category: 'cardio',
    purchaseDate: Date.now() - 86400000 * 180, // 6 months ago
    purchaseCost: 3000,
    currentValue: 2400,
    condition: 0.85,
    maintenanceInterval: 30, // 30 days
    lastMaintenance: Date.now() - 86400000 * 15, // 15 days ago
    nextMaintenance: Date.now() + 86400000 * 15, // 15 days from now
    usage: {
      totalHours: 450,
      weeklyHours: 25,
      monthlyHours: 100,
    },
    location: 'Cardio Area',
    specifications: {
      maxSpeed: 12,
      inclineLevels: 15,
      weightCapacity: 150,
      programs: 12,
    },
  };

  const sampleMember: Omit<GymMember, 'id'> = {
    name: 'Jane Member',
    joinDate: Date.now() - 86400000 * 90, // 3 months ago
    membershipType: 'premium',
    membershipStatus: 'active',
    monthlyFee: 49.99,
    attendance: {
      visitsThisMonth: 12,
      visitsLastMonth: 10,
      averageVisitsPerWeek: 3,
      favoriteClasses: ['Yoga', 'HIIT'],
      favoriteEquipment: ['Treadmill Pro X1', 'Dumbbells'],
    },
    fitness: {
      level: 6,
      goals: ['weight_loss', 'muscle_gain'],
      achievements: ['30_day_streak', 'first_5k'],
      personalRecords: {
        '5k_run': 28.5,
        'bench_press': 65,
        'squat': 80,
      },
    },
    payments: {
      lastPayment: Date.now() - 86400000 * 15,
      nextPayment: Date.now() + 86400000 * 15,
      outstandingBalance: 0,
      paymentMethod: 'credit_card',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSaveData = vi.mocked(await import('@/shared/persistence/PersistenceService')).saveData;
    mockLoadData = vi.mocked(await import('@/shared/persistence/PersistenceService')).loadData;

    // Mock successful save and load
    mockSaveData.mockResolvedValue();
    mockLoadData.mockResolvedValue({});

    gymService = new GymManagementService();
  });

  afterEach(() => {
    gymService.cleanup();
    cleanupGymManagement();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const state = gymService.getState();
      
      expect(state.config.business.name).toBe('Punch Club Gym');
      expect(state.config.business.type).toBe('commercial');
      expect(state.config.facilities.maxCapacity).toBe(150);
      expect(state.config.pricing.basicMembership).toBe(29.99);
    });

    it('should accept custom initial state', () => {
      const customState: Partial<GymState> = {
        config: {
          ...DEFAULT_GYM_CONFIG,
          business: {
            ...DEFAULT_GYM_CONFIG.business,
            name: 'Custom Gym',
          },
        },
      };

      const customService = new GymManagementService(customState);
      const state = customService.getState();
      
      expect(state.config.business.name).toBe('Custom Gym');
      customService.cleanup();
    });

    it('should initialize with empty collections', () => {
      const state = gymService.getState();
      
      expect(Object.keys(state.staff)).toHaveLength(0);
      expect(Object.keys(state.equipment)).toHaveLength(0);
      expect(Object.keys(state.members)).toHaveLength(0);
      expect(Object.keys(state.areas)).toHaveLength(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update gym configuration', () => {
      const configUpdates = {
        business: {
          ...DEFAULT_GYM_CONFIG.business,
          name: 'Updated Gym Name',
        },
      };

      gymService.updateConfig(configUpdates);
      const state = gymService.getState();
      
      expect(state.config.business.name).toBe('Updated Gym Name');
    });

    it('should preserve other config properties when updating', () => {
      const originalMaxCapacity = gymService.getState().config.facilities.maxCapacity;
      
      gymService.updateConfig({
        business: {
          ...DEFAULT_GYM_CONFIG.business,
          name: 'New Name',
        },
      });

      expect(gymService.getState().config.facilities.maxCapacity).toBe(originalMaxCapacity);
    });
  });

  describe('Staff Management', () => {
    it('should add new staff member', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      expect(staffId).toBeDefined();
      expect(staffId).toMatch(/^staff_\d+_[a-z0-9]+$/);
      
      const state = gymService.getState();
      const staff = state.staff[staffId];
      
      expect(staff).toBeDefined();
      expect(staff.name).toBe(sampleStaffMember.name);
      expect(staff.roleId).toBe(sampleStaffMember.roleId);
      expect(staff.status).toBe('active');
    });

    it('should update staff member', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      const updates = {
        level: 4,
        salary: 48000,
        performance: {
          rating: 4.8,
          memberSatisfaction: 0.9,
          retentionRate: 0.95,
          classesPerWeek: 15,
        },
      };

      const result = gymService.updateStaffMember(staffId, updates);
      
      expect(result).toBe(true);
      
      const state = gymService.getState();
      const staff = state.staff[staffId];
      
      expect(staff.level).toBe(4);
      expect(staff.salary).toBe(48000);
      expect(staff.performance.rating).toBe(4.8);
    });

    it('should return false when updating non-existent staff', () => {
      const result = gymService.updateStaffMember('non_existent_id', { level: 5 });
      
      expect(result).toBe(false);
    });

    it('should remove staff member', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      const result = gymService.removeStaffMember(staffId);
      
      expect(result).toBe(true);
      
      const state = gymService.getState();
      expect(state.staff[staffId]).toBeUndefined();
    });

    it('should return false when removing non-existent staff', () => {
      const result = gymService.removeStaffMember('non_existent_id');
      
      expect(result).toBe(false);
    });

    it('should remove associated schedules when removing staff', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      // Add a schedule for the staff member
      gymService.addStaffSchedule({
        id: 'test-schedule',
        staffId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        role: 'trainer',
        area: 'Weight Room',
      });
      
      gymService.removeStaffMember(staffId);
      
      const state = gymService.getState();
      const schedules = Object.values(state.schedules);
      
      expect(schedules.filter(s => s.staffId === staffId)).toHaveLength(0);
    });
  });

  describe('Staff Scheduling', () => {
    it('should add staff schedule', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      const scheduleId = gymService.addStaffSchedule({
        id: 'test-schedule',
        staffId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        role: 'trainer',
        area: 'Weight Room',
      });
      
      expect(scheduleId).toBeDefined();
      expect(scheduleId).toMatch(/^schedule_\d+_[a-z0-9]+$/);
      
      const state = gymService.getState();
      const schedule = state.schedules[scheduleId];
      
      expect(schedule).toBeDefined();
      expect(schedule.staffId).toBe(staffId);
      expect(schedule.dayOfWeek).toBe(1);
      expect(schedule.startTime).toBe('09:00');
      expect(schedule.endTime).toBe('17:00');
    });

    it('should get staff schedules for specific week', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      // Add schedules for current week
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + 1); // This Monday
      
      gymService.addStaffSchedule({
        id: 'schedule-1',
        staffId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        role: 'trainer',
        area: 'Weight Room',
      });
      
      gymService.addStaffSchedule({
        id: 'schedule-2',
        staffId,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '18:00',
        role: 'trainer',
        area: 'Cardio Area',
      });
      
      const schedules = gymService.getStaffSchedules(monday);
      
      expect(schedules).toHaveLength(2);
      expect(schedules.some(s => s.dayOfWeek === 1)).toBe(true);
      expect(schedules.some(s => s.dayOfWeek === 3)).toBe(true);
    });

    it('should get staff availability for time slot', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      const availableStaff = gymService.getStaffAvailability(1, '09:00', '17:00'); // Monday 9-5
      
      expect(availableStaff).toHaveLength(1);
      expect(availableStaff[0].id).toBe(staffId);
    });

    it('should not return unavailable staff for time slot', () => {
      const staffId = gymService.addStaffMember(sampleStaffMember);
      
      // Update staff to be unavailable on Monday mornings
      gymService.updateStaffMember(staffId, {
        availability: {
          ...sampleStaffMember.availability,
          monday: Array(48).fill(false), // Unavailable all day Monday
        },
      });
      
      const availableStaff = gymService.getStaffAvailability(1, '09:00', '17:00');
      
      expect(availableStaff).toHaveLength(0);
    });
  });

  describe('Equipment Management', () => {
    it('should add new equipment', () => {
      const equipmentId = gymService.addEquipment(sampleEquipment);
      
      expect(equipmentId).toBeDefined();
      expect(equipmentId).toMatch(/^equipment_\d+_[a-z0-9]+$/);
      
      const state = gymService.getState();
      const equipment = state.equipment[equipmentId];
      
      expect(equipment).toBeDefined();
      expect(equipment.name).toBe(sampleEquipment.name);
      expect(equipment.category).toBe(sampleEquipment.category);
      expect(equipment.condition).toBe(sampleEquipment.condition);
    });

    it('should update equipment', () => {
      const equipmentId = gymService.addEquipment(sampleEquipment);
      
      const updates = {
        condition: 0.9,
        currentValue: 2700,
        lastMaintenance: Date.now(),
      };

      const result = gymService.updateEquipment(equipmentId, updates);
      
      expect(result).toBe(true);
      
      const state = gymService.getState();
      const equipment = state.equipment[equipmentId];
      
      expect(equipment.condition).toBe(0.9);
      expect(equipment.currentValue).toBe(2700);
    });

    it('should return false when updating non-existent equipment', () => {
      const result = gymService.updateEquipment('non_existent_id', { condition: 0.5 });
      
      expect(result).toBe(false);
    });

    it('should schedule equipment maintenance', () => {
      const equipmentId = gymService.addEquipment(sampleEquipment);
      
      const maintenanceId = gymService.scheduleMaintenance({
        id: 'test-maintenance',
        equipmentId,
        scheduledDate: Date.now() + 86400000, // Tomorrow
        duration: 2, // 2 hours
        status: 'scheduled',
        priority: 'medium',
        cost: 150,
      });
      
      expect(maintenanceId).toBeDefined();
      expect(maintenanceId).toMatch(/^maintenance_\d+_[a-z0-9]+$/);
      
      const state = gymService.getState();
      const maintenance = state.maintenance[maintenanceId];
      
      expect(maintenance).toBeDefined();
      expect(maintenance.equipmentId).toBe(equipmentId);
      expect(maintenance.status).toBe('scheduled');
      expect(maintenance.priority).toBe('medium');
    });

    it('should get overdue maintenance', () => {
      const equipmentId = gymService.addEquipment(sampleEquipment);
      
      // Schedule maintenance for yesterday (overdue)
      gymService.scheduleMaintenance({
        id: 'overdue-maintenance',
        equipmentId,
        scheduledDate: Date.now() - 86400000, // Yesterday
        duration: 2,
        status: 'scheduled',
        priority: 'high',
        cost: 200,
      });
      
      // Schedule maintenance for tomorrow (not overdue)
      gymService.scheduleMaintenance({
        id: 'future-maintenance',
        equipmentId,
        scheduledDate: Date.now() + 86400000, // Tomorrow
        duration: 1,
        status: 'scheduled',
        priority: 'low',
        cost: 100,
      });
      
      const overdueMaintenance = gymService.getOverdueMaintenance();
      
      expect(overdueMaintenance).toHaveLength(1);
      expect(overdueMaintenance[0].id).toBe('overdue-maintenance');
    });
  });

  describe('Facility Management', () => {
    it('should add facility area', () => {
      const areaId = gymService.addFacilityArea({
        name: 'Weight Room',
        type: 'weight_room',
        size: 200,
        capacity: 30,
        equipment: [],
        amenities: ['showers', 'lockers'],
        condition: 0.9,
        upgradeLevel: 2,
        monthlyCost: 500,
        revenue: 2000,
      });
      
      expect(areaId).toBeDefined();
      expect(areaId).toMatch(/^area_\d+_[a-z0-9]+$/);
      
      const state = gymService.getState();
      const area = state.areas[areaId];
      
      expect(area).toBeDefined();
      expect(area.name).toBe('Weight Room');
      expect(area.type).toBe('weight_room');
      expect(area.capacity).toBe(30);
    });
  });

  describe('Member Management', () => {
    it('should add new gym member', () => {
      const memberId = gymService.addMember(sampleMember);
      
      expect(memberId).toBeDefined();
      expect(memberId).toMatch(/^member_\d+_[a-z0-9]+$/);
      
      const state = gymService.getState();
      const member = state.members[memberId];
      
      expect(member).toBeDefined();
      expect(member.name).toBe(sampleMember.name);
      expect(member.membershipType).toBe(sampleMember.membershipType);
      expect(member.membershipStatus).toBe(sampleMember.membershipStatus);
    });

    it('should update member information', () => {
      const memberId = gymService.addMember(sampleMember);
      
      const updates = {
        membershipType: 'vip' as const,
        monthlyFee: 99.99,
        fitness: {
          ...sampleMember.fitness,
          level: 7,
        },
      };

      const result = gymService.updateMember(memberId, updates);
      
      expect(result).toBe(true);
      
      const state = gymService.getState();
      const member = state.members[memberId];
      
      expect(member.membershipType).toBe('vip');
      expect(member.monthlyFee).toBe(99.99);
      expect(member.fitness.level).toBe(7);
    });

    it('should return false when updating non-existent member', () => {
      const result = gymService.updateMember('non_existent_id', { membershipType: 'basic' });
      
      expect(result).toBe(false);
    });
  });

  describe('Financial Management', () => {
    it('should update financial data', () => {
      const financialUpdates = {
        revenue: {
          membership: 10000,
          personalTraining: 5000,
          classes: 2000,
          merchandise: 1000,
          other: 500,
        },
        expenses: {
          staff: 8000,
          maintenance: 1000,
          utilities: 1500,
          equipment: 500,
          marketing: 800,
          other: 200,
        },
      };

      gymService.updateFinancials(financialUpdates);
      
      const state = gymService.getState();
      const finances = state.finances;
      
      expect(finances.revenue.membership).toBe(10000);
      expect(finances.revenue.personalTraining).toBe(5000);
      expect(finances.expenses.staff).toBe(8000);
      expect(finances.expenses.maintenance).toBe(1000);
      
      // Check calculated profit
      const totalRevenue = Object.values(finances.revenue).reduce((sum, val) => sum + val, 0);
      const totalExpenses = Object.values(finances.expenses).reduce((sum, val) => sum + val, 0);
      expect(finances.profit).toBe(totalRevenue - totalExpenses);
    });

    it('should generate financial report', () => {
      // Add some data
      gymService.addStaffMember(sampleStaffMember);
      gymService.addEquipment(sampleEquipment);
      gymService.addMember(sampleMember);
      
      gymService.updateFinancials({
        revenue: {
          membership: 10000,
          personalTraining: 5000,
          classes: 2000,
          merchandise: 1000,
          other: 500,
        },
        expenses: {
          staff: 8000,
          maintenance: 1000,
          utilities: 1500,
          equipment: 500,
          marketing: 800,
          other: 200,
        },
      });

      const report = gymService.generateFinancialReport();
      
      expect(report.summary).toBeDefined();
      expect(report.monthlyTrend).toBeDefined();
      expect(report.monthlyTrend).toHaveLength(6); // 6 months
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate recommendations based on metrics', () => {
      // Add data that would trigger recommendations
      gymService.addMember({
        ...sampleMember,
        membershipStatus: 'cancelled', // This should trigger churn recommendation
      });

      gymService.addEquipment({
        ...sampleEquipment,
        condition: 0.3, // Poor condition to trigger maintenance recommendation
      });

      const report = gymService.generateFinancialReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(rec => 
        rec.includes('member retention') || rec.includes('maintenance')
      )).toBe(true);
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate staff metrics', () => {
      // Add staff with different performance levels
      const staffId1 = gymService.addStaffMember({
        ...sampleStaffMember,
        name: 'High Performer',
        performance: { rating: 5, memberSatisfaction: 0.95, retentionRate: 0.98, classesPerWeek: 15 },
      });
      
      const staffId2 = gymService.addStaffMember({
        ...sampleStaffMember,
        name: 'Average Performer',
        performance: { rating: 3.5, memberSatisfaction: 0.8, retentionRate: 0.85, classesPerWeek: 10 },
      });

      // Add members to calculate staff-per-member ratio
      gymService.addMember(sampleMember);
      gymService.addMember({ ...sampleMember, name: 'Member 2' });

      const state = gymService.getState();
      const metrics = state.metrics.staff;
      
      expect(metrics.totalStaff).toBe(2);
      expect(metrics.staffPerMember).toBe(1); // 2 staff / 2 members
      expect(metrics.averageRating).toBe(4.25); // (5 + 3.5) / 2
    });

    it('should calculate equipment metrics', () => {
      const equipmentId1 = gymService.addEquipment({
        ...sampleEquipment,
        condition: 0.9,
        usage: { totalHours: 500, weeklyHours: 30, monthlyHours: 120 },
      });
      
      const equipmentId2 = gymService.addEquipment({
        ...sampleEquipment,
        name: 'Bench Press',
        category: 'strength',
        condition: 0.7,
        usage: { totalHours: 300, weeklyHours: 20, monthlyHours: 80 },
      });

      const state = gymService.getState();
      const metrics = state.metrics.equipment;
      
      expect(metrics.totalEquipment).toBe(2);
      expect(metrics.averageCondition).toBe(0.8); // (0.9 + 0.7) / 2
      expect(metrics.utilizationRate).toBeGreaterThan(0);
    });

    it('should calculate member metrics', () => {
      const memberId1 = gymService.addMember({
        ...sampleMember,
        membershipStatus: 'active',
        attendance: { ...sampleMember.attendance, averageVisitsPerWeek: 4 },
      });
      
      const memberId2 = gymService.addMember({
        ...sampleMember,
        name: 'Churned Member',
        membershipStatus: 'cancelled',
        attendance: { ...sampleMember.attendance, averageVisitsPerWeek: 1 },
      });

      const memberId3 = gymService.addMember({
        ...sampleMember,
        name: 'VIP Member',
        membershipType: 'vip',
        attendance: { ...sampleMember.attendance, averageVisitsPerWeek: 5 },
      });

      const state = gymService.getState();
      const metrics = state.metrics.members;
      
      expect(metrics.totalMembers).toBe(3);
      expect(metrics.retentionRate).toBeGreaterThan(0);
      expect(metrics.satisfactionScore).toBeGreaterThan(0);
    });
  });

  describe('Schedule Recommendations', () => {
    it('should generate schedule recommendations', () => {
      // Add staff
      gymService.addStaffMember(sampleStaffMember);
      
      // Add members to create demand
      for (let i = 0; i < 20; i++) {
        gymService.addMember({ ...sampleMember, name: `Member ${i}` });
      }

      const recommendations = gymService.generateScheduleRecommendations();
      
      expect(recommendations.understaffed).toBeDefined();
      expect(recommendations.overstaffed).toBeDefined();
      expect(recommendations.suggestions).toBeDefined();
      expect(Array.isArray(recommendations.suggestions)).toBe(true);
    });

    it('should identify understaffed periods', () => {
      // Add limited staff
      gymService.addStaffMember(sampleStaffMember);
      
      // Add many members to create high demand
      for (let i = 0; i < 50; i++) {
        gymService.addMember({ ...sampleMember, name: `Member ${i}` });
      }

      const recommendations = gymService.generateScheduleRecommendations();
      
      expect(recommendations.understaffed.length).toBeGreaterThan(0);
      expect(recommendations.understaffed[0]).toHaveProperty('day');
      expect(recommendations.understaffed[0]).toHaveProperty('time');
      expect(recommendations.understaffed[0]).toHaveProperty('needed');
      expect(recommendations.understaffed[0]).toHaveProperty('available');
    });
  });

  describe('State Persistence', () => {
    it('should save state automatically', async () => {
      gymService.addStaffMember(sampleStaffMember);
      
      // Wait a bit for auto-save to trigger
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSaveData).toHaveBeenCalledWith('gym_management_state', expect.any(Object));
    });

    it('should load state from storage', async () => {
      const savedState = {
        config: {
          ...DEFAULT_GYM_CONFIG,
          business: { ...DEFAULT_GYM_CONFIG.business, name: 'Loaded Gym' },
        },
        staff: {
          'staff_test': { ...sampleStaffMember, id: 'staff_test' },
        },
        lastUpdated: Date.now(),
      };

      mockLoadData.mockResolvedValue(savedState);
      
      await gymService.loadState();
      
      const state = gymService.getState();
      expect(state.config.business.name).toBe('Loaded Gym');
      expect(state.staff['staff_test']).toBeDefined();
    });
  });

  describe('Global Instance Management', () => {
    it('should return same global instance', () => {
      const service1 = getGymManagementService();
      const service2 = getGymManagementService();
      
      expect(service1).toBe(service2);
    });

    it('should initialize global service with custom state', () => {
      const customState: Partial<GymState> = {
        config: {
          ...DEFAULT_GYM_CONFIG,
          business: { ...DEFAULT_GYM_CONFIG.business, name: 'Custom Global Gym' },
        },
      };

      const service = initializeGymManagement(customState);
      const state = service.getState();
      
      expect(state.config.business.name).toBe('Custom Global Gym');
      service.cleanup();
    });

    it('should cleanup global service', () => {
      const service = getGymManagementService();
      expect(service).toBeDefined();
      
      cleanupGymManagement();
      
      const serviceAfterCleanup = getGymManagementService();
      expect(serviceAfterCleanup).not.toBe(service); // Should create new instance
    });
  });

  describe('Default Configurations', () => {
    it('should have default staff roles defined', () => {
      expect(DEFAULT_STAFF_ROLES).toBeDefined();
      expect(DEFAULT_STAFF_ROLES.trainer).toBeDefined();
      expect(DEFAULT_STAFF_ROLES.receptionist).toBeDefined();
      expect(DEFAULT_STAFF_ROLES.cleaner).toBeDefined();
      expect(DEFAULT_STAFF_ROLES.manager).toBeDefined();
      
      expect(DEFAULT_STAFF_ROLES.trainer.baseSalary).toBe(45000);
      expect(DEFAULT_STAFF_ROLES.receptionist.baseSalary).toBe(32000);
      expect(DEFAULT_STAFF_ROLES.cleaner.baseSalary).toBe(28000);
      expect(DEFAULT_STAFF_ROLES.manager.baseSalary).toBe(65000);
    });

    it('should have default gym configuration', () => {
      expect(DEFAULT_GYM_CONFIG).toBeDefined();
      expect(DEFAULT_GYM_CONFIG.business.name).toBe('Punch Club Gym');
      expect(DEFAULT_GYM_CONFIG.business.type).toBe('commercial');
      expect(DEFAULT_GYM_CONFIG.facilities.maxCapacity).toBe(150);
      expect(DEFAULT_GYM_CONFIG.pricing.basicMembership).toBe(29.99);
      expect(DEFAULT_GYM_CONFIG.pricing.premiumMembership).toBe(49.99);
      expect(DEFAULT_GYM_CONFIG.pricing.vipMembership).toBe(99.99);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid operations gracefully', () => {
      expect(gymService.updateStaffMember('', {})).toBe(false);
      expect(gymService.updateEquipment('', {})).toBe(false);
      expect(gymService.updateMember('', {})).toBe(false);
      expect(gymService.removeStaffMember('')).toBe(false);
    });

    it('should handle state loading errors', async () => {
      mockLoadData.mockRejectedValue(new Error('Load failed'));
      
      // Should not throw error
      await expect(gymService.loadState()).resolves.toBeUndefined();
    });

    it('should handle state saving errors', async () => {
      mockSaveData.mockRejectedValue(new Error('Save failed'));
      
      // Should not throw error
      await expect(gymService.addStaffMember(sampleStaffMember)).resolves.toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      gymService.addStaffMember(sampleStaffMember);
      
      // Verify data exists
      expect(Object.keys(gymService.getState().staff)).toHaveLength(1);
      
      gymService.cleanup();
      
      // Should save state before cleanup
      expect(mockSaveData).toHaveBeenCalled();
    });
  });
});
