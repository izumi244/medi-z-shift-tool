/**
 * API Client - 認証付きFetchラッパー
 *
 * 全てのAPIリクエストに自動的にセッショントークンを付与します
 */

import { STORAGE_KEYS } from './constants'

/**
 * 認証付きfetch関数
 *
 * @param url - リクエストURL
 * @param options - fetch options
 * @returns fetch Response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // ローカルストレージからセッショントークンを取得
  const sessionToken = typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEYS.SESSION)
    : null

  // ヘッダーにAuthorizationを追加
  const headers = {
    ...options.headers,
    ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
  }

  // 認証ヘッダー付きでfetchを実行
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 401エラーの場合は認証エラーとして処理
  if (response.status === 401) {
    // セッションが無効な場合はログアウト
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SESSION)
      window.location.href = '/login'
    }
  }

  return response
}

/**
 * JSON形式のPOSTリクエスト用ヘルパー
 */
export async function authenticatedPost<T = any>(
  url: string,
  data: any
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * GET リクエスト用ヘルパー
 */
export async function authenticatedGet<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API Error: ${response.status}`)
  }

  return response.json()
}
