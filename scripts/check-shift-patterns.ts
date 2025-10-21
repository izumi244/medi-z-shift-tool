// スクリプト: シフトパターンを確認
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vvxiclrupxwipfuxzqzg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eGljbHJ1cHh3aXBmdXh6cXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTMxNTcsImV4cCI6MjA3NjA2OTE1N30.1d2M9sYg17oCoGxbcbPX-VJVszvXzzttdvk5f4ShN50'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkShiftPatterns() {
  console.log('=== シフトパターン確認 ===\n')

  const { data, error } = await supabase
    .from('shift_patterns')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('エラー:', error)
    return
  }

  console.log('登録されているシフトパターン数:', data?.length)
  console.log('\n')

  data?.forEach((pattern, index) => {
    console.log(`[${index + 1}] ${pattern.name}`)
    console.log(`    ID: ${pattern.id}`)
    console.log(`    記号: ${pattern.symbol}`)
    console.log(`    時間: ${pattern.start_time} - ${pattern.end_time}`)
    console.log('')
  })

  // 従業員も確認
  const { data: empData } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true })

  console.log('\n=== 従業員確認 ===\n')
  console.log('登録されている従業員数:', empData?.length)
  console.log('\n')

  empData?.forEach((emp, index) => {
    console.log(`[${index + 1}] ${emp.name}`)
    console.log(`    ID: ${emp.id}`)
    console.log(`    雇用形態: ${emp.employment_type}`)
    console.log(`    職種: ${emp.job_type}`)
    console.log('')
  })
}

checkShiftPatterns()
