import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing postService
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

import { validatePost, getPosts, createPost } from '../services/postService';

describe('validatePost', () => {
  it('returns error if title is missing', () => {
    expect(validatePost({ title: '', content: 'a'.repeat(32) }))
      .toBe('Title must be between 16 and 64 characters.');
  });

  it('returns error if title is too short (15 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(15), content: 'a'.repeat(32) }))
      .toBe('Title must be between 16 and 64 characters.');
  });

  it('returns null for title at minimum boundary (16 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(16), content: 'a'.repeat(32) }))
      .toBeNull();
  });

  it('returns null for title at maximum boundary (64 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(64), content: 'a'.repeat(32) }))
      .toBeNull();
  });

  it('returns error if title is too long (65 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(65), content: 'a'.repeat(32) }))
      .toBe('Title must be between 16 and 64 characters.');
  });

  it('returns error if content is missing', () => {
    expect(validatePost({ title: 'a'.repeat(16), content: '' }))
      .toBe('Content must be between 32 and 8192 characters.');
  });

  it('returns error if content is too short (31 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(16), content: 'a'.repeat(31) }))
      .toBe('Content must be between 32 and 8192 characters.');
  });

  it('returns null for content at minimum boundary (32 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(16), content: 'a'.repeat(32) }))
      .toBeNull();
  });

  it('returns null for content at maximum boundary (8192 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(16), content: 'a'.repeat(8192) }))
      .toBeNull();
  });

  it('returns error if content is too long (8193 chars)', () => {
    expect(validatePost({ title: 'a'.repeat(16), content: 'a'.repeat(8193) }))
      .toBe('Content must be between 32 and 8192 characters.');
  });
});

describe('getPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase with correct sort column and returns data', async () => {
    const mockData = [{ id: '1', title: 'Test' }];
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    mockEq.mockReturnValueOnce({ eq: mockEq, order: mockOrder });
    mockEq.mockReturnValueOnce({ eq: mockEq, order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await getPosts('score');
    expect(mockFrom).toHaveBeenCalledWith('posts');
    expect(result).toEqual(mockData);
  });

  it('falls back to created_at for invalid sort', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValueOnce({ eq: mockEq, order: mockOrder });
    mockEq.mockReturnValueOnce({ eq: mockEq, order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    await getPosts('invalid_sort');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('throws on supabase error', async () => {
    const error = new Error('DB error');
    mockOrder.mockResolvedValue({ data: null, error });
    mockEq.mockReturnValueOnce({ eq: mockEq, order: mockOrder });
    mockEq.mockReturnValueOnce({ eq: mockEq, order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    await expect(getPosts()).rejects.toThrow('DB error');
  });
});

describe('createPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws validation error for invalid post data', async () => {
    await expect(
      createPost({ author_id: '1', category_id: '1', title: 'short', content: 'short' })
    ).rejects.toThrow('Title must be between 16 and 64 characters.');
    // Should not call supabase at all
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('calls supabase insert for valid post data', async () => {
    const mockPost = { id: '1', title: 'a'.repeat(16), content: 'a'.repeat(32) };
    mockSingle.mockResolvedValue({ data: mockPost, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const result = await createPost({
      author_id: 'user1',
      category_id: 'cat1',
      title: 'a'.repeat(16),
      content: 'a'.repeat(32),
    });

    expect(mockFrom).toHaveBeenCalledWith('posts');
    expect(result).toEqual(mockPost);
  });
});
