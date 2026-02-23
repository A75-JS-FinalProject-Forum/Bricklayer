import { supabase } from '../lib/supabase.js'

export const userService = {
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            throw new Error(`Error: ${error.message}`);
        }
        return data
    },

    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Error: ${error.message}`);
        }
        return data
    }
}