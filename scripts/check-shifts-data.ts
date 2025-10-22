// スクリプト: shifts テーブルのデータを確認
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkShiftsData() {
  console.log('=== Shifts データ確認 ===\n')

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('エラー:', error)
    return
  }

  console.log('総シフト数:', data?.length)
  console.log('\n')

  // 月ごとにグループ化
  const byMonth: { [key: string]: any[] } = {}
  data?.forEach(shift => {
    const month = shift.date.substring(0, 7) // "2025-01"
    if (!byMonth[month]) {
      byMonth[month] = []
    }
    byMonth[month].push(shift)
  })

  Object.entries(byMonth).forEach(([month, shifts]) => {
    console.log(`\n【${month}】: ${shifts.length}シフト`)
    shifts.slice(0, 3).forEach(shift => {
      console.log(`  - ${shift.date}: employee_id=${shift.employee_id}, pattern=${shift.shift_pattern_id}`)
    })
    if (shifts.length > 3) {
      console.log(`  ... 他 ${shifts.length - 3} シフト`)
    }
  })

  // 最新の10件を表示
  console.log('\n\n【最新10件】')
  data?.slice(-10).forEach(shift => {
    console.log(`${shift.date} | employee: ${shift.employee_id} | pattern: ${shift.shift_pattern_id} | symbol: ${shift.shift_symbol}`)
  })
}

checkShiftsData()
