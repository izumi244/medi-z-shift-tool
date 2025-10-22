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

async function deleteInvalidPatterns() {
  console.log('\n=== 不要なシフトパターンの削除 ===\n')

  // 削除対象のパターン名
  const invalidPatternNames = ['休み', '未定']

  for (const name of invalidPatternNames) {
    console.log(`"${name}" パターンを検索中...`)

    const { data: patterns, error: searchError } = await supabase
      .from('shift_patterns')
      .select('*')
      .eq('name', name)

    if (searchError) {
      console.error(`  エラー: ${searchError.message}`)
      continue
    }

    if (!patterns || patterns.length === 0) {
      console.log(`  見つかりませんでした`)
      continue
    }

    console.log(`  見つかりました: ${patterns.length}件`)

    for (const pattern of patterns) {
      console.log(`    削除中: [${pattern.symbol}] ${pattern.name}`)

      const { error: deleteError } = await supabase
        .from('shift_patterns')
        .delete()
        .eq('id', pattern.id)

      if (deleteError) {
        console.error(`    ❌ エラー: ${deleteError.message}`)
      } else {
        console.log(`    ✓ 削除完了`)
      }
    }
  }

  console.log('\n=== 削除完了 ===\n')

  // 残りのパターンを確認
  const { data: remainingPatterns } = await supabase
    .from('shift_patterns')
    .select('*')
    .order('name')

  if (remainingPatterns) {
    console.log('残りのシフトパターン:')
    remainingPatterns.forEach((p, index) => {
      console.log(`  ${index + 1}. [${p.symbol}] ${p.name} (${p.start_time}-${p.end_time})`)
    })
    console.log(`\n合計: ${remainingPatterns.length}件`)
  }
}

deleteInvalidPatterns()
