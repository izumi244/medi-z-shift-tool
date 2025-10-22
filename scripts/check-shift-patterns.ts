// スクリプト: シフトパターンを確認
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です')
  process.exit(1)
}

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
