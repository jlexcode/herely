import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://hmnpqnzmtanepowfoodn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbnBxbnptdGFuZXBvd2Zvb2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTExNTUsImV4cCI6MjA2MTUyNzE1NX0.2J6U3Cfuif2im5lZqdDdFTcCS2Zpf6YRWDkxnCaQzTI'; 
export const supabase = createClient(supabaseUrl, supabaseKey);