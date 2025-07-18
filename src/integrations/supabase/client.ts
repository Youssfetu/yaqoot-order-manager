// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fvnpufbjybgilyzxkvmn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bnB1ZmJqeWJnaWx5enhrdm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTIxODksImV4cCI6MjA2NzkyODE4OX0.rmbtw7wLo9IoMz9hAqMPjItTXKpyljPHHr4ZqVLKLzY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});