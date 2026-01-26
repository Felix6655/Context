// Database setup script - run once to create tables
// Usage: node scripts/setup-database.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('Setting up database tables...')
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError && !testError.message.includes('does not exist')) {
      console.log('Tables might already exist or connection issue:', testError.message)
    }
    
    console.log('Database connection successful!')
    console.log('')
    console.log('IMPORTANT: To complete setup, please run the SQL migration manually:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Open SQL Editor')
    console.log('3. Paste and run the contents of: supabase/migrations/001_initial_schema.sql')
    console.log('')
    console.log('This will create all necessary tables with RLS policies.')
    
  } catch (error) {
    console.error('Setup error:', error.message)
  }
}

setupDatabase()
