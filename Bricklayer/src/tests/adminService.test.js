import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

import { adminService } from '../services/adminService';

describe('adminService.getAllUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches paginated users with default page and limit', async () => {
    const users = [{ id: 'u1', username: 'alice' }];
    mockRange.mockResolvedValue({ data: users, count: 1, error: null });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({ order: mockOrder });

    const result = await adminService.getAllUsers();
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(mockRange).toHaveBeenCalledWith(0, 19);
    expect(result).toEqual({ data: users, total: 1 });
  });

  it('uses custom page and limit for pagination', async () => {
    mockRange.mockResolvedValue({ data: [], count: 0, error: null });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({ order: mockOrder });

    await adminService.getAllUsers(2, 10);
    expect(mockRange).toHaveBeenCalledWith(20, 29);
  });

  it('returns Error instance instead of throwing on error (bug A3)', async () => {
    mockRange.mockResolvedValue({ data: null, count: null, error: { message: 'DB error' } });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({ order: mockOrder });

    const result = await adminService.getAllUsers();
    // Bug A3: returns Error instead of throwing
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Error extracting all the user data');
  });
});

describe('adminService.toggleBlock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toggles block status and returns updated profile', async () => {
    const updated = { id: 'u1', is_blocked: true };
    mockSelect.mockResolvedValue({ data: [updated], error: null });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const result = await adminService.toggleBlock('u1', false);
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith({ is_blocked: true });
    expect(result).toEqual(updated);
  });

  it('returns Error for missing userId', async () => {
    const result = await adminService.toggleBlock(null, false);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Invalid user ID');
  });

  it('throws when no data returned', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    await expect(adminService.toggleBlock('u1', false)).rejects.toBeDefined();
  });
});

describe('adminService.toggleAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toggles admin status and returns updated profile', async () => {
    const updated = { id: 'u1', is_admin: true };
    mockSelect.mockResolvedValue({ data: [updated], error: null });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const result = await adminService.toggleAdmin('u1', false);
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith({ is_admin: true });
    expect(result).toEqual(updated);
  });

  it('returns Error for missing userId', async () => {
    const result = await adminService.toggleAdmin(undefined, true);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Invalid user ID');
  });
});

describe('adminService.getUserActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns post and comment counts for a user', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 12, error: null }),
          }),
        }),
      });

    const result = await adminService.getUserActivity('u1');
    expect(result).toEqual({ postsCount: 5, commentsCount: 12 });
  });

  it('defaults to 0 when counts are null', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: null }),
          }),
        }),
      });

    const result = await adminService.getUserActivity('u1');
    expect(result).toEqual({ postsCount: 0, commentsCount: 0 });
  });
});
