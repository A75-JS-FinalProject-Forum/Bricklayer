import { supabase } from '../lib/supabase';

export const searchService = {
    async globalSearch(query) {
        if (!query || query.trim().length < 2) {
            return { posts: [], users: [], tags: [] };
        }

        const searchTerm = `%${query}%`;

        const postsPromise = supabase
            .from('posts')
            .select(`
                *,
                profiles(username, avatar_url),
                categories(name)
            `)
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(10);

        const usersPromise = supabase
            .from('profiles')
            .select('username, avatar_url, reputation')
            .ilike('username', searchTerm)
            .limit(10);

        const tagsPromise = supabase
            .from('tags')
            .select('name')
            .ilike('name', searchTerm)
            .limit(10);

        const [postsResult, usersResult, tagsResult] = await Promise.all([
            postsPromise, 
            usersPromise, 
            tagsPromise
        ]);

        return {
            posts: postsResult.data || [],
            users: usersResult.data || [],
            tags: tagsResult.data || []
        };
    }
};