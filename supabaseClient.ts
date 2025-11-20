
import { createClient } from '@supabase/supabase-js';

// El ID del proyecto se extrajo del token JWT proporcionado (campo "ref": "rtwdjdbglwjqlkzndfms")
const supabaseUrl = 'https://rtwdjdbglwjqlkzndfms.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2RqZGJnbHdqcWxrem5kZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzkwNjYsImV4cCI6MjA3OTE1NTA2Nn0.GRFaDfeAEUgw1LnnWE4o-Bqfm3VUIIUVu21qylWcFig';

export const supabase = createClient(supabaseUrl, supabaseKey);
