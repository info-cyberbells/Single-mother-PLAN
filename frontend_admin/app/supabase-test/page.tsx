import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Test the connection by running a simple query
  const { data, error } = await supabase.from('todos').select().limit(1)

  // 42P01 is PostgreSQL native error for missing table
  // PGRST205 is PostgREST error for missing table in the schema cache
  const isTableMissing = error?.code === '42P01' || error?.code === 'PGRST205'

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Supabase Connection Status</h1>
      
      {error && !isTableMissing ? (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <h2>❌ Connection Failed</h2>
          <p><strong>Error Message:</strong> {error.message}</p>
          <p><strong>Error Code:</strong> {error.code}</p>
          <p>Make sure your URL and Key are correct in .env.local</p>
        </div>
      ) : (
        <div style={{ color: 'green', marginTop: '20px' }}>
          <h2>✅ Connected Successfully!</h2>
          <p>Your Next.js app is successfully communicating with Supabase.</p>
          {isTableMissing ? (
            <p style={{ color: '#b8860b' }}>Note: Connected, but the "todos" table does not exist yet. This is normal for a new project!</p>
          ) : data && data.length > 0 ? (
            <p>Found {data.length} items in the "todos" table.</p>
          ) : (
            <p>The "todos" table is empty.</p>
          )}
        </div>
      )}
    </div>
  )
}


