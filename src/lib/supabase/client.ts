import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Estas variables deben estar en tu archivo .env en la raíz del proyecto.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("La URL de Supabase y/o la clave anónima no se proporcionaron en las variables de entorno.")
}

export const createClient = () => createSupabaseClient(supabaseUrl, supabaseAnonKey)