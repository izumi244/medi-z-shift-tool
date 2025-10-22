// スクリプト: shifts テーブルの権限を確認
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkShiftsPermissions() {
  console.log('=== Shifts テーブル権限チェック ===\n')

  // 1. 読み取りテスト
  console.log('1. 読み取りテスト:')
  const { data: readData, error: readError } = await supabase
    .from('shifts')
    .select('*')
    .limit(1)

  if (readError) {
    console.error('❌ 読み取りエラー:', readError)
  } else {
    console.log('✅ 読み取り成功:', readData?.length, 'レコード')
  }

  // 2. 挿入テスト
  console.log('\n2. 挿入テスト:')
  const testShift = {
    employee_id: '00000000-0000-0000-0000-000000000000', // ダミーUUID
    date: '2025-11-01',
    shift_pattern_id: '00000000-0000-0000-0000-000000000000',
    shift_symbol: '○',
    actual_hours: 8,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: insertData, error: insertError } = await supabase
    .from('shifts')
    .insert(testShift)
    .select()

  if (insertError) {
    console.error('❌ 挿入エラー:', insertError)
    console.log('\nエラー詳細:')
    console.log('- code:', insertError.code)
    console.log('- message:', insertError.message)
    console.log('- details:', insertError.details)
    console.log('- hint:', insertError.hint)
  } else {
    console.log('✅ 挿入成功:', insertData)

    // テストデータを削除
    if (insertData && insertData[0]) {
      await supabase
        .from('shifts')
        .delete()
        .eq('id', insertData[0].id)
      console.log('✅ テストデータ削除完了')
    }
  }

  // 3. 削除テスト
  console.log('\n3. 削除テスト:')
  const { error: deleteError } = await supabase
    .from('shifts')
    .delete()
    .eq('date', '2025-11-01')

  if (deleteError) {
    console.error('❌ 削除エラー:', deleteError)
  } else {
    console.log('✅ 削除成功（実際には削除対象なし）')
  }

  console.log('\n=== チェック完了 ===')
}

checkShiftsPermissions()
