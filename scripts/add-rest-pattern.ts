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

async function addRestPattern() {
  console.log('\n=== 「休み」シフトパターンを追加 ===\n')

  // 既に存在するかチェック
  const { data: existing } = await supabase
    .from('shift_patterns')
    .select('*')
    .eq('name', '休み')

  if (existing && existing.length > 0) {
    console.log('「休み」パターンは既に存在します')
    console.log(`  [${existing[0].symbol}] ${existing[0].name}`)
    return
  }

  // 「休み」パターンを追加
  console.log('「休み」パターンを追加中...')

  const { data, error } = await supabase
    .from('shift_patterns')
    .insert({
      symbol: '×',
      name: '休み',
      start_time: '-',
      end_time: '-',
      work_minutes: 0,
      break_minutes: 0
    })
    .select()
    .single()

  if (error) {
    console.error(`❌ エラー: ${error.message}`)
    return
  }

  console.log('✓ 追加完了')
  console.log(`  [${data.symbol}] ${data.name}`)

  console.log('\n=== 完了 ===\n')

  // 全パターンを確認
  const { data: allPatterns } = await supabase
    .from('shift_patterns')
    .select('*')
    .order('name')

  if (allPatterns) {
    console.log('現在のシフトパターン:')
    allPatterns.forEach((p, index) => {
      console.log(`  ${index + 1}. [${p.symbol}] ${p.name} (${p.start_time}-${p.end_time})`)
    })
    console.log(`\n合計: ${allPatterns.length}件`)
  }
}

addRestPattern()
