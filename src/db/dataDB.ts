import type { AppearanceData, ContentData, LabelingData, MainData } from '../types'

// --- 配置區 ---
const DB_NAME = 'MedicineLookupDB'
const DB_VERSION = 1

// 定義所有 Object Store 的名稱、KeyPath 和需要建立的索引
export const STORE_CONFIG = {
  // 注意：CONTENT 的 KeyPath 設為 'contentKey'，需要在服務層預先處理數據
  APPEARANCE: { name: 'appearance', keyPath: 'permitNo', indices: ['engName', 'chsName'] },
  CONTENT: { name: 'content', keyPath: 'contentKey', indices: ['permitNo', 'contentName'] },
  LABELING: { name: 'labeling', keyPath: 'permitNo', indices: ['engName', 'chsName'] },
  MAINDATA: { name: 'maindata', keyPath: 'medicineId', indices: ['group', 'engName', 'chsName'] },
} as const

type StoreName = (typeof STORE_CONFIG)[keyof typeof STORE_CONFIG]['name']
type DataType = AppearanceData | ContentData | LabelingData | MainData
type IDBMode = 'readonly' | 'readwrite'
type TransactionCallback<T> = (store: IDBObjectStore) => IDBRequest<T>

let db: IDBDatabase | null = null

// --- 核心函式：資料庫開啟與升級 ---

/**
 * 處理資料庫結構升級：建立 Object Store 和索引
 * 這是修復 TypeScript 錯誤和整合索引創建的關鍵函式。
 */
function handleUpgrade(event: IDBVersionChangeEvent) {
  const dbInstance = (event.target as IDBOpenDBRequest).result

  Object.values(STORE_CONFIG).forEach((config) => {
    let store: IDBObjectStore | null = null

    // 1. 建立 Object Store (如果不存在)
    if (!dbInstance.objectStoreNames.contains(config.name)) {
      console.log(`Creating Object Store: ${config.name}`)
      // **關鍵：dbInstance.createObjectStore 返回 IDBObjectStore 實例**
      store = dbInstance.createObjectStore(config.name, { keyPath: config.keyPath })
    } else {
      // 如果 Object Store 存在，在 onupgradeneeded 中，我們透過 transaction 取得引用，以便操作索引
      const transaction = (event.target as IDBOpenDBRequest).transaction!
      store = transaction.objectStore(config.name)
    }

    // 2. 建立索引 (遍歷配置中的所有索引)
    if (store) {
      config.indices.forEach((indexName) => {
        // 檢查索引是否已存在 (避免重複建立引發錯誤)
        if (!store!.indexNames.contains(indexName)) {
          console.log(`Creating index '${indexName}' for ${config.name}.`)
          // 索引名稱和欄位名稱相同
          store!.createIndex(indexName, indexName, { unique: false })
        }
      })
    }
  })
}

/**
 * 開啟或建立資料庫連接
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = handleUpgrade // 使用抽離的升級函式

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = () => {
      console.error('IndexedDB 錯誤:', request.error)
      reject(request.error)
    }
  })
}

// --- 通用事務處理函式 (Transaction Wrapper) ---

/**
 * 執行 IndexedDB 事務的通用 wrapper 函式
 */
async function executeTransaction<T>(
  storeName: StoreName,
  mode: IDBMode,
  callback: TransactionCallback<T>
): Promise<T> {
  const db = await openDB()

  // 建立事務
  const transaction = db.transaction(storeName, mode)
  const store = transaction.objectStore(storeName)

  return new Promise((resolve, reject) => {
    // 執行傳入的資料庫操作
    const request = callback(store)

    // 處理讀取請求的成功
    if (mode === 'readonly') {
      request.onsuccess = () => resolve(request.result as T)
    }

    // 處理請求錯誤 (適用於所有模式)
    request.onerror = () => {
      console.error(`DB Request Error in ${storeName}:`, request.error)
      reject(request.error)
    }

    // 處理寫入事務的完成
    if (mode === 'readwrite') {
      transaction.oncomplete = () => {
        // 寫入操作成功完成
        resolve(undefined as T)
      }
      transaction.onerror = () => {
        console.error(`DB Transaction Error in ${storeName}:`, transaction.error)
        reject(transaction.error)
      }
    }
  })
}

// --- 最終簡化的讀寫與查詢函式 ---

/**
 * 取得 Object Store 中的所有資料
 */
export async function getAllData<T extends DataType>(storeName: StoreName): Promise<T[]> {
  // 使用 executeTransaction 封裝 store.getAll()
  return executeTransaction<T[]>(storeName, 'readonly', (store) => store.getAll())
}

/**
 * 清空並寫入所有資料
 */
export async function setAllData<T extends DataType>(
  storeName: StoreName,
  data: T[]
): Promise<void> {
  // 由於我們只關心事務完成，泛型參數 T 應該是 void
  return executeTransaction<void>(storeName, 'readwrite', (store) => {
    store.clear()

    let lastRequest: IDBRequest | null = null

    data.forEach((item) => {
      // 將最後一個 put 請求賦值給 lastRequest
      lastRequest = store.put(item)
    })

    // 如果 data 是空陣列，則返回 store.clear() 的請求，它返回 IDBRequest<void>
    // 否則返回最後一個 store.put() 的請求 (IDBRequest<IDBValidKey>)
    // 雖然 put 的返回型別仍然不是 void，但在 readwrite 模式下，我們依賴的是 transaction.oncomplete，
    // 因此只需返回一個有效的 IDBRequest 即可滿足類型要求，並讓 TypeScript 接受它。
    return lastRequest || (store.clear() as IDBRequest<any>)
  })
}

/**
 * 透過索引執行查詢 (精確匹配或範圍查詢)
 * @param queryKey 精確查詢值或 IDBKeyRange
 */
export async function queryByIndex<T extends DataType>(
  storeName: StoreName,
  indexName: string,
  queryKey: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  return executeTransaction<T[]>(storeName, 'readonly', (store) => {
    const index = store.index(indexName)
    // 使用 index.getAll() 進行查詢
    return index.getAll(queryKey)
  })
}

/**
 * 透過 KeyPath (主鍵) 查詢 Object Store 中的單筆資料
 * @param key 主鍵值 (例如：permitNo, medicineId, contentKey)
 */
export async function queryById<T extends DataType>(
  storeName: StoreName,
  key: IDBValidKey
): Promise<T | undefined> {
  // 使用 executeTransaction 封裝 store.get(key)
  // 注意：store.get() 返回 T | undefined
  return executeTransaction<T | undefined>(storeName, 'readonly', (store) => store.get(key))
}
