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

async function checkSchema() {
  console.log('\n=== shift_patterns テーブルのスキーマ確認 ===\n')

  const { data, error } = await supabase
    .from('shift_patterns')
    .select('*')
    .limit(1)

  if (error) {
    console.error('エラー:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('データが存在しません')
    return
  }

  console.log('カラム一覧:')
  const columns = Object.keys(data[0])
  columns.forEach((col, index) => {
    const value = data[0][col]
    const type = typeof value
    console.log(`  ${index + 1}. ${col} (型: ${type}, 値例: ${JSON.stringify(value)})`)
  })

  console.log(`\n合計: ${columns.length} カラム`)
}

checkSchema()
