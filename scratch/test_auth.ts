import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testAuth() {
  console.log('Testing Supabase Auth with URL:', process.env.VITE_SUPABASE_URL);
  
  const email = `test_${Date.now()}@ecotroca.com`;
  const password = 'password123';

  console.log('Attempting to sign up:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Signup failed:', error);
  } else {
    console.log('Signup successful! User ID:', data.user?.id);
  }
}

testAuth();
