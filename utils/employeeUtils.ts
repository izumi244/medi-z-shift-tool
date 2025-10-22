/**
 * 従業員関連のユーティリティ関数
 */

/**
 * 配列要素からIDマップを生成（index + 1 を数字キーとする）
 *
 * @param items - マッピング対象の配列（id プロパティを持つオブジェクト）
 * @returns インデックス（1始まり）をキーとするIDマップ
 * @example
 * const employees = [{id: 'emp-001'}, {id: 'emp-002'}]
 * createIdMap(employees) // {'1': 'emp-001', '2': 'emp-002'}
 */
export function createIdMap<T extends { id: string }>(items: T[]): Record<string, string> {
  return items.reduce((map, item, index) => {
    map[String(index + 1)] = item.id
    return map
  }, {} as Record<string, string>)
}
