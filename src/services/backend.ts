import { isSupabaseConfigured } from '@/lib/supabase';
import { demoBackend } from './demo/demoBackend';
import { supabaseBackend } from './supabase/supabaseBackend';
import type { Backend } from './types';

/** Supabase when EXPO_PUBLIC_SUPABASE_* env vars are set, otherwise the in-memory demo backend. */
export const backend: Backend = isSupabaseConfigured ? supabaseBackend : demoBackend;
export type { Backend } from './types';
