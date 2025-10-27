import type { AppearanceData } from '../types'
import { STORE_CONFIG, setAllData, getAllData, queryByIndex, queryById } from '../db/dataDB'

// 服務配置
const JSON_URL = '/meddb-web/data/appearance.json'
const STORE_NAME = STORE_CONFIG.APPEARANCE.name
const CACHE_EXPIRATION_MS = 60 * 60 * 1000 // 範例：快取 1 小時

/**
 * AppearanceService 負責管理藥品外觀資料的載入、快取和查詢。
 * 採用單例模式，確保只有一個實例管理記憶體快取。
 */
class AppearanceService {
  // 記憶體快取 (private 屬性)
  private cachedData: AppearanceData[] = []
  private isLoading: boolean = false
  private lastFetchTime: number = 0

  // 1. 網路載入函式
  private async fetchRawData(): Promise<AppearanceData[]> {
    console.log(`-> 網路下載 ${JSON_URL} 中...`)
    const response = await fetch(JSON_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${JSON_URL}`)
    }
    const rawData = await response.json()
    console.log(`-> ${JSON_URL} 下載完成。`)
    return rawData as AppearanceData[]
  }

  /**
   * 核心載入邏輯：檢查快取 -> IndexedDB -> 網路
   * @returns 藥品外觀數據
   */
  public async getAppearanceData(): Promise<AppearanceData[]> {
    // 避免重複請求，或實現一個等待機制
    if (this.isLoading) {
      // 簡單處理：如果正在載入，等待 100ms 後再嘗試獲取
      await new Promise((resolve) => setTimeout(resolve, 100))
      return this.getAppearanceData()
    }

    // 1. 記憶體快取檢查 (和有效期檢查)
    if (this.cachedData.length > 0 && Date.now() - this.lastFetchTime < CACHE_EXPIRATION_MS) {
      return this.cachedData
    }

    this.isLoading = true

    try {
      // 2. 嘗試從 IndexedDB 載入
      const dbData = await getAllData<AppearanceData>(STORE_NAME)

      if (dbData.length > 0) {
        console.log('🚀 Loaded AppearanceData from IndexedDB.')
        this.cachedData = dbData
        this.lastFetchTime = Date.now()
        return dbData
      }

      // 3. IndexedDB 無資料，進行網路載入
      console.log('🌐 IndexedDB empty. Fetching raw AppearanceData...')
      const rawData = await this.fetchRawData()

      // 4. 存入 IndexedDB
      await setAllData<AppearanceData>(STORE_NAME, rawData)
      console.log('💾 AppearanceData stored in IndexedDB.')

      this.cachedData = rawData
      this.lastFetchTime = Date.now()
      return rawData
    } catch (error) {
      console.error('Error loading AppearanceData:', error)
      return []
    } finally {
      this.isLoading = false
    }
  }

  /**
   * 透過主鍵 permitNo 查詢單筆資料
   */
  public async getByPermitNo(id: string): Promise<AppearanceData | undefined> {
    // 確保資料已經載入到記憶體快取中
    // await this.getAppearanceData()
    // return this.cachedData.find((d) => d.permitNo === id)
    return queryById<AppearanceData>(STORE_NAME, id)
  }

  /**
   * 透過 engName 索引查詢資料
   */
  public async getByEngName(engName: string): Promise<AppearanceData[]> {
    // 雖然 IndexedDB 查詢更高效，但在數據已被載入記憶體的情況下，直接在快取中查詢更快
    // await this.getAppearanceData()
    // 由於記憶體快取已包含所有數據，我們直接在記憶體中過濾
    // return this.cachedData.filter(d => d.engName === engName);

    // 如果數據過大不想全載入記憶體，則使用 DB 查詢：
    return queryByIndex<AppearanceData>(STORE_NAME, 'engName', engName)
  }

  /**
   * 透過 chsName 索引查詢資料
   */
  public async getByChsName(chsName: string): Promise<AppearanceData[]> {
    // await this.getAppearanceData()
    // return this.cachedData.filter(d => d.chsName === chsName);

    // 如果數據過大不想全載入記憶體，則使用 DB 查詢：
    return queryByIndex<AppearanceData>(STORE_NAME, 'chsName', chsName)
  }
}

// 實例化 Service 並將其實例作為模組的預設匯出 (單例模式)
const appearanceService = new AppearanceService()
export { appearanceService }
