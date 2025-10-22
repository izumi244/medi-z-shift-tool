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

async function fixDjSymbol() {
  console.log('\n=== 「ｄｊ」パターンの記号を修正 ===\n')

  // 「ｄｊ」パターンを検索
  const { data: patterns, error: searchError } = await supabase
    .from('shift_patterns')
    .select('*')
    .eq('name', 'ｄｊ')

  if (searchError) {
    console.error(`エラー: ${searchError.message}`)
    return
  }

  if (!patterns || patterns.length === 0) {
    console.log('「ｄｊ」パターンが見つかりませんでした')
    return
  }

  console.log(`「ｄｊ」パターンを見つけました: ${patterns.length}件`)

  for (const pattern of patterns) {
    console.log(`  現在: [${pattern.symbol}] ${pattern.name}`)
    console.log(`  新しい記号「▶」に変更中...`)

    const { error: updateError } = await supabase
      .from('shift_patterns')
      .update({ symbol: '▶' })
      .eq('id', pattern.id)

    if (updateError) {
      console.error(`  ❌ エラー: ${updateError.message}`)
    } else {
      console.log(`  ✓ 変更完了`)
    }
  }

  console.log('\n=== 修正完了 ===\n')

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

    // 記号の重複チェック
    const symbolCounts: Record<string, number> = {}
    allPatterns.forEach(p => {
      const symbol = p.symbol || 'null'
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

fixDjSymbol()
