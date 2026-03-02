import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSelect = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
  delete: mockDelete,
  select: mockSelect,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

import {
  castPostVote,
  castCommentVote,
  removePostVote,
  removeCommentVote,
  getUserPostVote,
  getUserCommentVote,
} from '../services/voteService';

describe('castPostVote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upserts a post vote and returns data', async () => {
    const vote = { user_id: 'u1', post_id: 'p1', vote_type: 1 };
    mockSingle.mockResolvedValue({ data: vote, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockUpsert.mockReturnValue({ select: mockSelect });

    const result = await castPostVote('u1', 'p1', 1);
    expect(mockFrom).toHaveBeenCalledWith('votes');
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'u1', post_id: 'p1', comment_id: null, vote_type: 1 },
      { onConflict: 'user_id,post_id' }
    );
    expect(result).toEqual(vote);
  });

  it('throws on supabase error', async () => {
    const error = new Error('upsert failed');
    mockSingle.mockResolvedValue({ data: null, error });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockUpsert.mockReturnValue({ select: mockSelect });

    await expect(castPostVote('u1', 'p1', 1)).rejects.toThrow('upsert failed');
  });
});

describe('castCommentVote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upserts a comment vote and returns data', async () => {
    const vote = { user_id: 'u1', comment_id: 'c1', vote_type: -1 };
    mockSingle.mockResolvedValue({ data: vote, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockUpsert.mockReturnValue({ select: mockSelect });

    const result = await castCommentVote('u1', 'c1', -1);
    expect(mockFrom).toHaveBeenCalledWith('votes');
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: 'u1', post_id: null, comment_id: 'c1', vote_type: -1 },
      { onConflict: 'user_id,comment_id' }
    );
    expect(result).toEqual(vote);
  });
});

describe('removePostVote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a post vote and returns true', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });

    const result = await removePostVote('u1', 'p1');
    expect(mockFrom).toHaveBeenCalledWith('votes');
    expect(result).toBe(true);
  });

  it('throws on supabase error', async () => {
    const error = new Error('delete failed');
    mockEq.mockResolvedValue({ error });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });

    await expect(removePostVote('u1', 'p1')).rejects.toThrow('delete failed');
  });
});

describe('removeCommentVote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a comment vote and returns true', async () => {
    mockEq.mockResolvedValue({ error: null });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });

    const result = await removeCommentVote('u1', 'c1');
    expect(mockFrom).toHaveBeenCalledWith('votes');
    expect(result).toBe(true);
  });
});

describe('getUserPostVote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns vote data when vote exists', async () => {
    const vote = { user_id: 'u1', post_id: 'p1', vote_type: 1 };
    mockMaybeSingle.mockResolvedValue({ data: vote, error: null });
    mockEq.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }) });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await getUserPostVote('u1', 'p1');
    expect(mockFrom).toHaveBeenCalledWith('votes');
    expect(result).toEqual(vote);
  });

  it('returns null when no vote exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }) });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await getUserPostVote('u1', 'p1');
    expect(result).toBeNull();
  });
});

describe('getUserCommentVote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns vote data when vote exists', async () => {
    const vote = { user_id: 'u1', comment_id: 'c1', vote_type: -1 };
    mockMaybeSingle.mockResolvedValue({ data: vote, error: null });
    mockEq.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }) });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await getUserCommentVote('u1', 'c1');
    expect(mockFrom).toHaveBeenCalledWith('votes');
    expect(result).toEqual(vote);
  });

  it('returns null when no vote exists', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }) });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await getUserCommentVote('u1', 'c1');
    expect(result).toBeNull();
  });
});
