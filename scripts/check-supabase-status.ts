import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// .env.localを読み込む
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkShiftPatterns() {
  console.log('\n=== シフトパターン確認 ===\n')

  const { data, error } = await supabase
    .from('shift_patterns')
    .select('*')
    .order('name')

  if (error) {
    console.error('エラー:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('シフトパターンが登録されていません')
    return
  }

  console.log(`登録されているシフトパターン: ${data.length}件\n`)

  // 全パターンを表示
  console.log('登録パターン一覧:')
  data.forEach((p, index) => {
    console.log(`  ${index + 1}. [${p.symbol || 'null'}] ${p.name} (${p.start_time}-${p.end_time}, ${p.work_minutes}分)`)
  })

  // 記号ごとにグループ化
  const symbolGroups: Record<string, any[]> = {}
  data.forEach(pattern => {
    const symbol = pattern.symbol || 'null'
    if (!symbolGroups[symbol]) {
      symbolGroups[symbol] = []
    }
    symbolGroups[symbol].push(pattern)
  })

  // 記号ごとの集計を表示
  console.log('\n記号別集計:')
  Object.entries(symbolGroups).forEach(([symbol, patterns]) => {
    console.log(`  "${symbol}": ${patterns.length}件`)
  })

  console.log(`\n異なる記号の種類数: ${Object.keys(symbolGroups).length}種類`)
  console.log(`使用されている記号: ${Object.keys(symbolGroups).join(', ')}`)
}

checkShiftPatterns()
