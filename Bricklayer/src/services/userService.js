import { supabase } from '../lib/supabase.js'

// Get total user count
export async function getTotalUsers() {

    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
    
    if (error) throw new Error(error.message);

    return count;
}

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
            

        if (error) {
            throw new Error(`Error: ${error.message}`);
        }
        return data
    }
}