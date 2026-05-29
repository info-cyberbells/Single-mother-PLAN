import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div>
      <h1>Supabase Connection Test</h1>
      <ul>
        {todos?.map((todo: any) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
        {(!todos || todos.length === 0) && <li>No todos found or connection failed.</li>}
      </ul>
    </div>
  )
}
