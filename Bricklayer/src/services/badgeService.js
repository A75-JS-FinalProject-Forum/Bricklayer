import { supabase } from '../lib/supabase';

export const badgeService = {
  async getAllBadges() {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('criteria_value');

    if (error) throw error;
    return data;
  },

  async getUserBadges(userId) {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async awardBadge(userId, badgeId) {
    const { data, error } = await supabase
      .from('user_badges')
      .upsert({ user_id: userId, badge_id: badgeId })
      .select();

    if (error) throw error;
    return data;
  },

  async checkAndAwardBadges(userId) {
    const [allBadges, currentBadges, postsResult, commentsResult, profileResult] = await Promise.all([
      this.getAllBadges(),
      this.getUserBadges(userId),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId).eq('is_deleted', false),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userId).eq('is_deleted', false),
      supabase.from('profiles').select('reputation').eq('id', userId).single(),
    ]);

    const postsCount = postsResult.count ?? 0;
    const commentsCount = commentsResult.count ?? 0;
    const reputation = profileResult.data?.reputation ?? 0;

    const currentBadgeIds = new Set(currentBadges.map(ub => ub.badge_id));
    const newlyAwarded = [];

    for (const badge of allBadges) {
      if (currentBadgeIds.has(badge.id)) continue;

      let currentValue = 0;
      if (badge.criteria_type === 'posts_count') currentValue = postsCount;
      else if (badge.criteria_type === 'comments_count') currentValue = commentsCount;
      else if (badge.criteria_type === 'reputation') currentValue = reputation;

      if (currentValue >= badge.criteria_value) {
        await this.awardBadge(userId, badge.id);
        newlyAwarded.push(badge);
      }
    }

    return newlyAwarded;
  },
};
