import type { ContentData } from '../types'
import { STORE_CONFIG, setAllData, getAllData, queryById, queryByIndex } from '../db/dataDB'

// 服務配置
const JSON_URL = '/data/content.json'
const STORE_NAME = STORE_CONFIG.CONTENT.name
const CACHE_EXPIRATION_MS = 60 * 60 * 1000 // 範例：快取 1 小時

/**
 * ContentService 負責管理藥品成分數據的載入、快取和查詢。
 * 採用單例模式。
 */
class ContentService {
  // 記憶體快取 (private 屬性)
  private cachedData: ContentData[] = []
  private isLoading: boolean = false
  private lastFetchTime: number = 0

  // 1. 網路載入函式 (包含複合鍵處理)
  private async fetchRawData(): Promise<ContentData[]> {
    console.log(`-> 網路下載 ${JSON_URL} 中...`)
    const response = await fetch(JSON_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${JSON_URL}`)
    }
    // 這裡我們需要使用 Omit 類型斷言，因為原始 JSON 沒有 contentKey
    const rawData = (await response.json()) as Omit<ContentData, 'contentKey'>[]

    // *** 數據預處理：生成 contentKey ***
    const processedData: ContentData[] = rawData.map((item) => ({
      ...item,
      // 使用複合鍵 permitNo|contentNo
      contentKey: `${item.permitNo}|${item.contentNo}`,
    }))

    return processedData
  }

  /**
   * 核心載入邏輯：檢查快取 -> IndexedDB -> 網路
   * @returns 藥品成分數據
   */
  public async getContentData(): Promise<ContentData[]> {
    // 避免重複請求
    if (this.isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return this.getContentData()
    }

    // 1. 記憶體快取檢查
    if (this.cachedData.length > 0 && Date.now() - this.lastFetchTime < CACHE_EXPIRATION_MS) {
      return this.cachedData
    }

    this.isLoading = true

    try {
      // 2. 嘗試從 IndexedDB 載入
      const dbData = await getAllData<ContentData>(STORE_NAME)

      if (dbData.length > 0) {
        console.log('🚀 Loaded ContentData from IndexedDB.')
        this.cachedData = dbData
        this.lastFetchTime = Date.now()
        return dbData
      }

      // 3. IndexedDB 無資料，進行網路載入
      console.log('🌐 IndexedDB empty. Fetching raw ContentData...')
      const rawData = await this.fetchRawData()

      // 4. 存入 IndexedDB
      await setAllData<ContentData>(STORE_NAME, rawData)
      console.log('💾 ContentData stored in IndexedDB.')

      this.cachedData = rawData
      this.lastFetchTime = Date.now()
      return rawData
    } catch (error) {
      console.error('Error loading ContentData:', error)
      return []
    } finally {
      this.isLoading = false
    }
  }

  /**
   * 透過複合主鍵 (contentKey) 查詢單筆資料
   */
  public async getDataByContentKey(id: string): Promise<ContentData | undefined> {
    // 確保數據已載入到記憶體快取中
    // await this.getContentData()
    // 使用最快的記憶體查找
    // return this.cachedData.find((d) => d.contentKey === contentKey)
    return queryById<ContentData>(STORE_NAME, id)
  }

  /**
   * 透過 permitNo (非主鍵索引) 查詢
   */
  public async getByPermitNo(permitNo: string): Promise<ContentData[]> {
    // await this.getContentData()
    // return this.cachedData.filter(d => d.permitNo === permitNo);
    return queryByIndex<ContentData>(STORE_NAME, 'permitNo', permitNo)
  }

  /**
   * 透過 contentName (非主鍵索引) 查詢
   */
  public async getByContentName(contentName: string): Promise<ContentData[]> {
    // await this.getContentData()
    // return this.cachedData.filter(d => d.contentName === contentName);
    return queryByIndex<ContentData>(STORE_NAME, 'contentName', contentName)
  }
}

// 實例化 Service
const contentService = new ContentService()

export { contentService }
