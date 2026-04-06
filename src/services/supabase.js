import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://byriesholblgyysnmnpu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmllc2hvbGJsZ3l5c25tbnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDI4ODgsImV4cCI6MjA4NDY3ODg4OH0.QppXyuMNaidr3oNoCBv3SImYctDVgeLbWqeg60u3auE'


export const supabase = createClient(supabaseUrl, supabaseKey)