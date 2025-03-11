
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zxyyalnafhelbmglnzhx.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eXlhbG5hZmhlbGJtZ2xuemh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2OTE0OTgsImV4cCI6MjA1NzI2NzQ5OH0.vNyIeAF6dxnBV0_GetyH_VGvXEyV4aEupjkpTbGtEoQ"
export const supabase = createClient(supabaseUrl, supabaseKey)