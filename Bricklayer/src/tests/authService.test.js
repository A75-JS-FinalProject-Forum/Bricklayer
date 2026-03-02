import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSignUp = vi.fn();
const mockUpdateUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args) => mockSignUp(...args),
      updateUser: (...args) => mockUpdateUser(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  },
}));

import { authService } from '../services/authService';

describe('authService.signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks for existing username before signing up', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { username: 'taken' } });

    await expect(
      authService.signUp({
        email: 'test@test.com',
        password: 'password123',
        username: 'taken',
        firstName: 'Test',
        lastName: 'User',
      })
    ).rejects.toThrow('User with this username already exist.');

    // Should not call auth.signUp since username was taken
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls auth.signUp when username is available', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockSignUp.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null,
    });

    const result = await authService.signUp({
      email: 'test@test.com',
      password: 'password123',
      username: 'newuser',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
      options: {
        data: {
          username: 'newuser',
          first_name: 'Test',
          last_name: 'User',
        },
      },
    });
    expect(result).toEqual({ user: { id: '1' }, session: {} });
  });

  it('throws on auth.signUp error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockSignUp.mockResolvedValue({
      data: null,
      error: new Error('Signup failed'),
    });

    await expect(
      authService.signUp({
        email: 'test@test.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'Test',
        lastName: 'User',
      })
    ).rejects.toThrow('Signup failed');
  });
});

describe('authService.updateEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes { email: newEmail } to updateUser (not password)', async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });

    await authService.updateEmail('new@example.com');

    expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'new@example.com' });
    // Verify it does NOT pass password
    const callArg = mockUpdateUser.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('password');
  });

  it('returns error on failure instead of throwing', async () => {
    const err = new Error('Update failed');
    mockUpdateUser.mockResolvedValue({ data: null, error: err });

    const result = await authService.updateEmail('bad@example.com');
    expect(result).toEqual(err);
  });
});
