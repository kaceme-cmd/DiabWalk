import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ycldbhhynywsvqkuqgwf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljbGRiaGh5bnl3c3Zxa3VxZ3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzU5MzQsImV4cCI6MjA5NjI1MTkzNH0.HUAeMqYPSxqpgfEVh_6nirZ6_kN7zo2mVhUyT2-snho';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});