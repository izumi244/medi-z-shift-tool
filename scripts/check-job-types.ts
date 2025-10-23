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

async function checkJobTypes() {
  console.log('\n=== 職種の確認 ===\n')

  const { data: employees, error } = await supabase
    .from('employees')
    .select('job_type')

  if (error) {
    console.error('エラー:', error)
    return
  }

  if (!employees || employees.length === 0) {
    console.log('従業員データが存在しません')
    return
  }

  // 職種を集計
  const jobTypes = new Set<string>()
  employees.forEach(emp => {
    if (emp.job_type) {
      jobTypes.add(emp.job_type)
    }
  })

  console.log('登録されている職種:')
  Array.from(jobTypes).sort().forEach((jobType, index) => {
    const count = employees.filter(e => e.job_type === jobType).length
    console.log(`  ${index + 1}. ${jobType} (${count}人)`)
  })

  console.log(`\n合計: ${jobTypes.size}種類`)
}

checkJobTypes()
