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
    },

    async getUserPublicProfile(username) {
        const {data ,error} = await supabase
            .from('profiles')
            .select('username', 'avatar_url', 'reputation', 'created_at')
            .eq('username', username)
            .single();

        if (error) {
            return new Error('User with this username does not exist');
        }
        return data;
    },

    
  async getProfileByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, reputation, created_at')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  }
}