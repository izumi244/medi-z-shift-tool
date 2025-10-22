import { NextRequest, NextResponse } from 'next/server'
import { createIdMap } from '@/utils/employeeUtils'

// 週のキーを取得（月曜日始まり）
function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const dayOfWeek = date.getDay() // 0=日, 1=月, ..., 6=土

  // 月曜日を週の始まりとして計算
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(year, month, day + mondayOffset)

  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

// カレンダー生成関数（休診日を除外した営業日のみ）
function generateBusinessCalendar(targetMonth: string, closedDays: number[]) {
  const [year, month] = targetMonth.split('-').map(Number)
  const calendar = []
  const daysInMonth = new Date(year, month, 0).getDate()

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()

    // 休診日は除外
    if (closedDays.includes(dayOfWeek)) {
      continue
    }

    calendar.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day_of_week: dayNames[dayOfWeek],
      day_number: day
    })
  }

  return calendar
}

interface GenerateShiftRequest {
  target_month: string
  employees: Array<{
    id: string
    name: string
    employee_number: string
    job_type: string
  }>
  leave_requests: Array<{
    id: string
    employee_id: string
    start_date: string
    end_date: string
    reason?: string
  }>
  shift_patterns: Array<{
    id: string
    name: string
    start_time: string
    end_time: string
    required_staff: number
  }>
  constraints: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateShiftRequest = await request.json()

    // Dify APIキーとURLを環境変数から取得
    const difyApiKey = process.env.DIFY_API_KEY
    const difyApiUrl = process.env.DIFY_API_URL

    console.log('Dify API Key:', difyApiKey ? `${difyApiKey.substring(0, 10)}...` : 'NOT FOUND')
    console.log('Dify API URL:', difyApiUrl || 'NOT FOUND')

    if (!difyApiKey || !difyApiUrl) {
      return NextResponse.json(
        { error: 'Dify API設定が見つかりません' },
        { status: 500 }
      )
    }

    // 制約条件から休診日を抽出
    const closedDays: number[] = []
    const dayNameToNumber: { [key: string]: number } = {
      '日曜': 0, '日': 0,
      '月曜': 1, '月': 1,
      '火曜': 2, '火': 2,
      '水曜': 3, '水': 3,
      '木曜': 4, '木': 4,
      '金曜': 5, '金': 5,
      '土曜': 6, '土': 6
    }

    Object.entries(dayNameToNumber).forEach(([dayName, dayNum]) => {
      if (body.constraints.includes(dayName) && body.constraints.includes('休診')) {
        if (!closedDays.includes(dayNum)) {
          closedDays.push(dayNum)
        }
      }
    })

    console.log('Detected closed days:', closedDays)

    // 営業日カレンダーを生成（休診日を除外）
    const businessCalendar = generateBusinessCalendar(body.target_month, closedDays)
    console.log('Business calendar generated:', businessCalendar.length, 'days')
    console.log('Calendar first 3 days:', JSON.stringify(businessCalendar.slice(0, 3), null, 2))

    // シンプルなカレンダーフォーマット（日付のみ、LLMが理解しやすい）
    const calendarSimple = `営業日一覧（この日付のみ使用可能）:\n${businessCalendar.map(d => d.date).join('\n')}`

    console.log('Calendar simple format:', calendarSimple)

    // Dify Workflow APIを呼び出し（ストリーミングモード）
    const response = await fetch(`${difyApiUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          target_month: body.target_month,
          calendar: calendarSimple,
          employees: JSON.stringify(body.employees, null, 2),
          leave_requests: JSON.stringify(body.leave_requests, null, 2),
          shift_patterns: JSON.stringify(body.shift_patterns, null, 2),
          constraints: body.constraints,
        },
        response_mode: 'streaming',
        user: 'shift-admin',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', errorText)
      return NextResponse.json(
        { error: 'Dify APIエラー', details: errorText },
        { status: response.status }
      )
    }

    // ストリーミングレスポンスを処理
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    if (!reader) {
      throw new Error('Response body is null')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.substring(6))

            console.log('Event:', jsonData.event, 'Data keys:', Object.keys(jsonData.data || {}))

            // workflow_finishedイベントからデータを取得
            if (jsonData.event === 'workflow_finished') {
              const outputs = jsonData.data?.outputs
              console.log('Workflow finished outputs:', outputs)
              if (outputs && outputs.result) {
                fullText = outputs.result
              }
            }

            // text_chunkイベントからテキストを収集
            if (jsonData.event === 'text_chunk') {
              fullText += jsonData.data?.text || ''
            }

            // node_finishedイベントも確認（LLMノードの出力）
            if (jsonData.event === 'node_finished' && jsonData.data?.node_type === 'llm') {
              const outputs = jsonData.data?.outputs
              console.log('LLM node outputs:', outputs)
              if (outputs && outputs.text) {
                fullText = outputs.text
              }
            }
          } catch (e) {
            // JSON parse error - skip
          }
        }
      }
    }

    console.log('Dify full text length:', fullText.length)
    console.log('Dify full text preview:', fullText.substring(0, 500))

    // テキストからJSON部分を抽出
    let shiftData
    try {
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       fullText.match(/(\{[\s\S]*"shifts"[\s\S]*\})/)

      if (jsonMatch && jsonMatch[1]) {
        // JSONコメントを削除（// で始まる行を削除）
        let jsonText = jsonMatch[1]
        jsonText = jsonText.replace(/\/\/.*$/gm, '') // 行コメント削除
        jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, '') // ブロックコメント削除

        // 制御文字を削除
        jsonText = jsonText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

        console.log('Sanitized JSON length:', jsonText.length)
        console.log('Sanitized JSON preview:', jsonText.substring(0, 500))

        shiftData = JSON.parse(jsonText)
        console.log('Parsed shift data:', shiftData.shifts?.length || 0, 'shifts')
      } else {
        throw new Error('JSON data not found in response')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Full text:', fullText)

      // JSONパースに失敗した場合、部分的にでもデータを抽出する試み
      try {
        console.log('Attempting to extract partial data from broken JSON...')

        const shiftObjects = []
        const shiftRegex = /\{\s*(?:[^{}]*?"employee_id"\s*:\s*(?:")?(\d+)(?:")?\s*,?\s*)?(?:[^{}]*?"date"\s*:\s*"([\d-]+)"\s*,?\s*)?(?:[^{}]*?"shift_pattern_id"\s*:\s*(?:")?(\d+)(?:")?\s*,?\s*)?[^{}]*?\}/g

        let match
        while ((match = shiftRegex.exec(fullText)) !== null) {
          const employeeId = match[1]
          const date = match[2]
          const shiftPatternId = match[3]

          // 3つの必須フィールドがすべて存在し、日付が有効な場合のみ追加
          if (employeeId && date && shiftPatternId && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            shiftObjects.push({
              date: date,
              employee_id: employeeId,
              shift_pattern_id: shiftPatternId,
              notes: ''
            })
          }
        }

        if (shiftObjects.length > 0) {
          console.log(`Extracted ${shiftObjects.length} shifts from broken JSON`)
          shiftData = {
            shifts: shiftObjects,
            summary: { total_shifts: shiftObjects.length, warnings: ['部分的に復元'] }
          }
        } else {
          throw new Error('No shifts could be extracted')
        }
      } catch (extractError) {
        console.error('Failed to extract partial data:', extractError)
        shiftData = {
          shifts: [],
          summary: { total_shifts: 0, warnings: ['JSONパースエラー'] },
          raw_result: fullText
        }
      }
    }

    // IDマッピング: 数字の文字列を実際のUUIDに変換
    if (shiftData.shifts && shiftData.shifts.length > 0) {
      // 従業員IDマッピング（配列のインデックス＋1が数字IDになっている想定）
      const employeeIdMap = createIdMap(body.employees)

      // シフトパターンIDマッピング
      const shiftPatternIdMap = createIdMap(body.shift_patterns)

      console.log('Employee ID mapping:', employeeIdMap)
      console.log('Shift pattern ID mapping:', shiftPatternIdMap)

      // シフトデータのIDを変換（存在しないIDはフィルタリング）
      const convertedShifts = shiftData.shifts
        .map((shift: any) => ({
          ...shift,
          employee_id: employeeIdMap[String(shift.employee_id)] || shift.employee_id,
          shift_pattern_id: shiftPatternIdMap[String(shift.shift_pattern_id)] || shift.shift_pattern_id
        }))
        .filter((shift: any) => {
          // 有効なUUIDのみ残す（変換できなかったものは除外）
          const employeeIdStr = String(shift.employee_id)
          const patternIdStr = String(shift.shift_pattern_id)
          const hasValidEmployeeId = shift.employee_id && employeeIdStr.includes('-')
          const hasValidPatternId = shift.shift_pattern_id && patternIdStr.includes('-')

          if (!hasValidEmployeeId || !hasValidPatternId) {
            console.warn('Invalid shift (skipped):', shift)
            return false
          }
          return true
        })

      // シフトのバリデーション＆自動修正
      const validatedShifts = convertedShifts.filter((shift: any) => {
        // 0. 日付の有効性チェック（11月31日などの無効な日付を除外）
        const shiftDate = new Date(shift.date)

        // 日付が無効かチェック（例: 2025-11-31 は無効）
        const dateStr = shift.date
        const [year, month, day] = dateStr.split('-').map(Number)
        const reconstructedDate = new Date(year, month - 1, day)

        if (
          reconstructedDate.getFullYear() !== year ||
          reconstructedDate.getMonth() !== month - 1 ||
          reconstructedDate.getDate() !== day
        ) {
          console.warn('Invalid date (skipped):', shift.date)
          return false
        }

        const dayOfWeek = shiftDate.getDay() // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土

        // 1. 従業員の勤務可能曜日チェック
        const employee = body.employees.find((emp: any) => emp.uuid === shift.employee_id)
        if (employee && employee.available_days) {
          const dayNames = ['日', '月', '火', '水', '木', '金', '土']
          const shiftDayName = dayNames[dayOfWeek]

          if (!employee.available_days.includes(shiftDayName)) {
            console.warn(`Removed shift for ${employee.name} on unavailable day:`, shift.date, shiftDayName)
            return false
          }
        }

        return true
      })

      // 3. 週の勤務日数制限チェック（週ごとにカウント）
      const finalShifts: any[] = []
      const weeklyShiftCounts: { [key: string]: { [week: string]: number } } = {}

      validatedShifts.forEach((shift: any) => {
        const employee = body.employees.find((emp: any) => emp.uuid === shift.employee_id)
        if (!employee) return

        const shiftDate = new Date(shift.date)
        // 週の開始を月曜日として週番号を計算
        const weekKey = getWeekKey(shiftDate)
        const employeeId = shift.employee_id

        if (!weeklyShiftCounts[employeeId]) {
          weeklyShiftCounts[employeeId] = {}
        }
        if (!weeklyShiftCounts[employeeId][weekKey]) {
          weeklyShiftCounts[employeeId][weekKey] = 0
        }

        // 週の最大勤務日数チェック
        if (weeklyShiftCounts[employeeId][weekKey] < employee.max_days_per_week) {
          weeklyShiftCounts[employeeId][weekKey]++
          finalShifts.push(shift)
        } else {
          console.warn(`Removed shift for ${employee.name} - exceeds max_days_per_week (${employee.max_days_per_week}):`, shift.date)
        }
      })

      shiftData.shifts = finalShifts
      console.log('Original shifts:', convertedShifts.length)
      console.log('After validation:', finalShifts.length, '(removed', convertedShifts.length - finalShifts.length, 'invalid shifts)')
      console.log('Validated first shift:', shiftData.shifts[0])
    }

    return NextResponse.json({
      success: true,
      data: shiftData,
    })

  } catch (error) {
    console.error('Error generating shift:', error)
    return NextResponse.json(
      { error: 'シフト生成中にエラーが発生しました', details: String(error) },
      { status: 500 }
    )
  }
}
