import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://ncymtdnmpcjinhmyqntq.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeW10ZG5tcGNqaW5obXlxbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTY3NTgsImV4cCI6MjA5OTI3Mjc1OH0.Kx0AOaA6EW9z4oiobty0NL8LXwJ9tg-KcDiOsS27ECE';

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
