import { describe, it, expect } from 'vitest';
import { buildCommentTree } from '../utils/commentTree';

describe('buildCommentTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('returns all comments as roots when none have parent_id', () => {
    const comments = [
      { id: '1', parent_id: null, content: 'First' },
      { id: '2', parent_id: null, content: 'Second' },
      { id: '3', parent_id: null, content: 'Third' },
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(3);
    tree.forEach(node => {
      expect(node.children).toEqual([]);
    });
  });

  it('nests children under their parent (2-level tree)', () => {
    const comments = [
      { id: '1', parent_id: null, content: 'Root' },
      { id: '2', parent_id: '1', content: 'Reply to root' },
      { id: '3', parent_id: '1', content: 'Another reply' },
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe('2');
    expect(tree[0].children[1].id).toBe('3');
  });

  it('handles deeply nested comments (3+ levels)', () => {
    const comments = [
      { id: '1', parent_id: null, content: 'Root' },
      { id: '2', parent_id: '1', content: 'Level 2' },
      { id: '3', parent_id: '2', content: 'Level 3' },
      { id: '4', parent_id: '3', content: 'Level 4' },
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].children[0].children[0].id).toBe('4');
  });

  it('handles orphan parent_id gracefully (parent not in array)', () => {
    const comments = [
      { id: '1', parent_id: null, content: 'Root' },
      { id: '2', parent_id: 'nonexistent', content: 'Orphan' },
    ];
    const tree = buildCommentTree(comments);
    // Orphan is silently dropped since parent doesn't exist in map
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
  });

  it('preserves all original comment properties', () => {
    const comments = [
      { id: '1', parent_id: null, content: 'Root', score: 5, author_id: 'abc' },
    ];
    const tree = buildCommentTree(comments);
    expect(tree[0].content).toBe('Root');
    expect(tree[0].score).toBe(5);
    expect(tree[0].author_id).toBe('abc');
    expect(tree[0].children).toEqual([]);
  });

  it('handles multiple root comments each with children', () => {
    const comments = [
      { id: '1', parent_id: null, content: 'Root A' },
      { id: '2', parent_id: null, content: 'Root B' },
      { id: '3', parent_id: '1', content: 'Reply to A' },
      { id: '4', parent_id: '2', content: 'Reply to B' },
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('3');
    expect(tree[1].children).toHaveLength(1);
    expect(tree[1].children[0].id).toBe('4');
  });
});
