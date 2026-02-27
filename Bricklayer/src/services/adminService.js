import { supabase } from "../lib/supabase";

export const adminService = {
    async getAllUsers(page = 0, limit = 20) {
        const from = page * limit;
        const to = from + limit - 1;
        const {data, count, error} = await supabase
            .from('profiles')
            .select('*', {count: 'exact'})
            .order('created_at', {ascending: true})
            .range(from, to);
        if (error) {
            return new Error('Error extracting all the user data')
        } return {data: data, total: count}
    },

    async toggleBlock(userId, currentStatus) {
        if (!userId) return new Error('Invalid user ID')
        const {data , error} = await supabase
            .from('profiles')
            .update({'is_blocked': !currentStatus})
            .eq('id', String(userId))
            .select()
        
        if (!data || data.length === 0 || error) throw error;
        return data[0];        
    },

    async toggleAdmin(userId, currentStatus) {
        if (!userId) return new Error('Invalid user ID') 
        const {data , error} = await supabase
            .from('profiles')
            .update({'is_admin': !currentStatus})
            .eq('id', String(userId))
            .select()
            
        if (!data || data.length === 0 || error) throw error;
        return data[0];
    }
}