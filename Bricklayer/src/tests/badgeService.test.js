import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockUpsert = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

import { badgeService } from '../services/badgeService';

describe('badgeService.getAllBadges', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all badges ordered by criteria_value', async () => {
    const badges = [{ id: '1', name: 'First Post', criteria_value: 1 }];
    mockOrder.mockResolvedValue({ data: badges, error: null });
    mockSelect.mockReturnValue({ order: mockOrder });

    const result = await badgeService.getAllBadges();
    expect(mockFrom).toHaveBeenCalledWith('badges');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('criteria_value');
    expect(result).toEqual(badges);
  });

  it('throws on supabase error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    mockSelect.mockReturnValue({ order: mockOrder });

    await expect(badgeService.getAllBadges()).rejects.toEqual({ message: 'DB error' });
  });
});

describe('badgeService.getUserBadges', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches user badges with joined badge data', async () => {
    const userBadges = [{ user_id: 'u1', badge_id: 'b1', badges: { name: 'First Post' } }];
    mockOrder.mockResolvedValue({ data: userBadges, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await badgeService.getUserBadges('u1');
    expect(mockFrom).toHaveBeenCalledWith('user_badges');
    expect(mockSelect).toHaveBeenCalledWith('*, badges(*)');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result).toEqual(userBadges);
  });

  it('returns empty array when user has no badges', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await badgeService.getUserBadges('u1');
    expect(result).toEqual([]);
  });

  it('throws on supabase error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'query failed' } });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    await expect(badgeService.getUserBadges('u1')).rejects.toEqual({ message: 'query failed' });
  });
});

describe('badgeService.awardBadge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upserts a badge award and returns data', async () => {
    const row = [{ user_id: 'u1', badge_id: 'b1' }];
    mockSelect.mockResolvedValue({ data: row, error: null });
    mockUpsert.mockReturnValue({ select: mockSelect });

    const result = await badgeService.awardBadge('u1', 'b1');
    expect(mockFrom).toHaveBeenCalledWith('user_badges');
    expect(mockUpsert).toHaveBeenCalledWith({ user_id: 'u1', badge_id: 'b1' });
    expect(result).toEqual(row);
  });

  it('throws on supabase error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'upsert failed' } });
    mockUpsert.mockReturnValue({ select: mockSelect });

    await expect(badgeService.awardBadge('u1', 'b1')).rejects.toEqual({ message: 'upsert failed' });
  });
});

describe('badgeService.checkAndAwardBadges', () => {
  beforeEach(() => vi.clearAllMocks());

  it('awards missing badges when criteria are met', async () => {
    const allBadges = [
      { id: 'b1', name: 'First Post', criteria_type: 'posts_count', criteria_value: 1 },
      { id: 'b2', name: 'Rising Star', criteria_type: 'reputation', criteria_value: 10 },
    ];
    const currentBadges = [];

    // Mock getAllBadges
    const getAllSpy = vi.spyOn(badgeService, 'getAllBadges').mockResolvedValue(allBadges);
    // Mock getUserBadges
    const getUserSpy = vi.spyOn(badgeService, 'getUserBadges').mockResolvedValue(currentBadges);
    // Mock awardBadge
    const awardSpy = vi.spyOn(badgeService, 'awardBadge').mockResolvedValue([{}]);

    // Mock supabase calls for stats
    mockSingle.mockResolvedValue({ data: { reputation: 15 }, error: null });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    // Mock the count queries (posts and comments)
    mockFrom
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 3, error: null }) }) }) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { reputation: 15 }, error: null }) }) }) });

    const result = await badgeService.checkAndAwardBadges('u1');

    expect(getAllSpy).toHaveBeenCalled();
    expect(getUserSpy).toHaveBeenCalledWith('u1');
    expect(awardSpy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);

    getAllSpy.mockRestore();
    getUserSpy.mockRestore();
    awardSpy.mockRestore();
  });

  it('skips badges the user already has', async () => {
    const allBadges = [
      { id: 'b1', name: 'First Post', criteria_type: 'posts_count', criteria_value: 1 },
    ];
    const currentBadges = [{ badge_id: 'b1', badges: { name: 'First Post' } }];

    const getAllSpy = vi.spyOn(badgeService, 'getAllBadges').mockResolvedValue(allBadges);
    const getUserSpy = vi.spyOn(badgeService, 'getUserBadges').mockResolvedValue(currentBadges);
    const awardSpy = vi.spyOn(badgeService, 'awardBadge').mockResolvedValue([{}]);

    mockFrom
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 5, error: null }) }) }) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { reputation: 0 }, error: null }) }) }) });

    const result = await badgeService.checkAndAwardBadges('u1');

    expect(awardSpy).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);

    getAllSpy.mockRestore();
    getUserSpy.mockRestore();
    awardSpy.mockRestore();
  });
});
