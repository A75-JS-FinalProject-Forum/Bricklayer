import { supabase } from '../lib/supabase';

export const searchService = {
    async globalSearch(query) {
        if (!query || query.trim().length < 2) {
            return { posts: [], users: [], tags: [] };
        }

        // Use * wildcard (PostgREST native) instead of % to avoid URL double-encoding
        const searchTerm = `*${query.trim()}*`;

        // Search posts by title OR content using .or() with * wildcards
        const postsPromise = supabase
            .from('posts')
            .select('*, profiles!posts_author_id_fkey(username, avatar_url), categories(name)')
            .eq('is_deleted', false)
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(10);

        // Find posts via their tags: get tags matching the query, then extract linked posts
        const tagPostsPromise = supabase
            .from('tags')
            .select('name, post_tags(posts(id, title, score, comments_count, created_at, is_deleted, profiles!posts_author_id_fkey(username, avatar_url), categories(name)))')
            .ilike('name', searchTerm)
            .limit(10);

        const usersPromise = supabase
            .from('profiles')
            .select('username, avatar_url, reputation')
            .ilike('username', searchTerm)
            .limit(10);

        // Include post_tags so we can filter out tags with no posts
        const tagsPromise = supabase
            .from('tags')
            .select('name, post_tags(post_id)')
            .ilike('name', searchTerm)
            .limit(10);

        const [postsResult, tagPostsResult, usersResult, tagsResult] = await Promise.all([
            postsPromise,
            tagPostsPromise,
            usersPromise,
            tagsPromise
        ]);

        // Log any errors for debugging
        if (postsResult.error) console.error('Search posts error:', postsResult.error);
        if (tagPostsResult.error) console.error('Search tag-posts error:', tagPostsResult.error);
        if (usersResult.error) console.error('Search users error:', usersResult.error);
        if (tagsResult.error) console.error('Search tags error:', tagsResult.error);

        // Merge and deduplicate posts from title/content search + tag-based search
        const postMap = new Map();
        for (const post of (postsResult.data || [])) {
            postMap.set(post.id, post);
        }
        // Extract posts from tag-based results
        for (const tag of (tagPostsResult.data || [])) {
            for (const pt of (tag.post_tags || [])) {
                const post = pt.posts;
                if (post && !post.is_deleted && !postMap.has(post.id)) {
                    postMap.set(post.id, post);
                }
            }
        }

        // Filter tags to only those with at least one post
        const filteredTags = (tagsResult.data || []).filter(
            tag => tag.post_tags && tag.post_tags.length > 0
        ).map(tag => ({ name: tag.name }));

        return {
            posts: Array.from(postMap.values()),
            users: usersResult.data || [],
            tags: filteredTags
        };
    },

    async getPopularPosts(limit = 5) {
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, score, profiles!posts_author_id_fkey(username)')
            .eq('is_deleted', false)
            .order('score', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
};
