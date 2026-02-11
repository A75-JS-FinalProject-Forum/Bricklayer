import { supabase } from '../lib/supabase.js';

export const authService = {
    async signUp({ email, password, username }) {
        const { data: existing } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (existing) {
            throw new Error('User with this username already exist.');
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username },
            },
        });

        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    },
};