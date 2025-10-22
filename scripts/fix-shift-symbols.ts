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

async function fixShiftSymbols() {
  console.log('\n=== シフトパターン記号の修正 ===\n')

  // 既存のシフトパターンを取得
  const { data: patterns, error } = await supabase
    .from('shift_patterns')
    .select('*')
    .order('name')

  if (error) {
    console.error('エラー:', error)
    return
  }

  if (!patterns || patterns.length === 0) {
    console.log('シフトパターンが登録されていません')
    return
  }

  console.log(`登録されているシフトパターン: ${patterns.length}件\n`)

  // 記号のマッピング（パターン名に基づいて）
  const symbolMapping: Record<string, string> = {
    '通常勤務': '○',
    '短時間': '▲',
    '遅番': '◆',
    'ｄｊ': '■',
    '休み': '✕',
    '未定': '▶'
  }

  // 各パターンに記号を設定
  for (const pattern of patterns) {
    const symbol = symbolMapping[pattern.name] || '○'

    console.log(`"${pattern.name}" に記号 "${symbol}" を設定中...`)

    const { error: updateError } = await supabase
      .from('shift_patterns')
      .update({ shift_symbol: symbol })
      .eq('id', pattern.id)

    if (updateError) {
      console.error(`  エラー: ${updateError.message}`)
    } else {
      console.log(`  ✓ 完了`)
    }
  }

  console.log('\n=== 修正完了 ===\n')

  // 修正後の確認
  const { data: updatedPatterns } = await supabase
    .from('shift_patterns')
    .select('*')
    .order('name')

  if (updatedPatterns) {
    console.log('修正後のシフトパターン:')
    updatedPatterns.forEach(p => {
      console.log(`  ${p.shift_symbol} - ${p.name} (${p.start_time}-${p.end_time})`)
    })

    // 記号の重複をチェック
    const symbolCounts: Record<string, number> = {}
    updatedPatterns.forEach(p => {
      const symbol = p.shift_symbol || 'null'
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1
    })

    console.log('\n記号の使用状況:')
    Object.entries(symbolCounts).forEach(([symbol, count]) => {
      if (count > 1) {
        console.log(`  ⚠️  "${symbol}": ${count}件（重複）`)
      } else {
        console.log(`  ✓ "${symbol}": ${count}件`)
      }
    })
  }
}

fixShiftSymbols()
