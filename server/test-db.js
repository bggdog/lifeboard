import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Test what columns exist
async function test() {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns found:', data.length > 0 ? Object.keys(data[0]) : 'No data, but table exists');
  }
  
  // Try inserting with different column name formats
  const testTodo = {
    id: 'test-' + Date.now(),
    text: 'Test',
    completed: false,
    createdAt: new Date().toISOString(),
    order: 0,
  };
  
  console.log('\nTrying insert with:', testTodo);
  const { data: insertData, error: insertError } = await supabase
    .from('todos')
    .insert(testTodo)
    .select();
  
  if (insertError) {
    console.error('Insert error:', insertError.message);
  } else {
    console.log('Success!', insertData);
  }
}

test();
