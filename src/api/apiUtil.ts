import { appearanceService } from '../services/appearanceService'
import { contentService } from '../services/contentService'
import { labelingService } from '../services/labelingService'
import { mainDataService } from '../services/mainDataService'

// 匯入所有必要的 Type (保持不變)
import type { AppearanceData, ContentData, LabelingData, MainData } from '../types'

/**
 * ApiUtil
 * 應用程式的數據存取工具層。
 * 它整合了所有藥品數據相關的查詢和快取功能。
 */
export const ApiUtil = {
  // <--- 頂層物件命名為 ApiUtil

  // --- Appearance API (外觀數據) ---
  AppearanceApi: {
    /** 獲取所有藥品外觀數據，觸發快取邏輯。 */
    getAll: async (): Promise<AppearanceData[]> => {
      return appearanceService.getAppearanceData()
    },
    /** 透過許可證號 (permitNo) 查詢單筆數據。 */
    getByPermitNo: async (permitNo: string): Promise<AppearanceData | undefined> => {
      return appearanceService.getByPermitNo(permitNo)
    },
    /** 依英文名稱精確過濾。 */
    filterByEngName: async (engName: string): Promise<AppearanceData[]> => {
      return appearanceService.getByEngName(engName)
    },
    /** 依中文名稱精確過濾。 */
    filterByChsName: async (chsName: string): Promise<AppearanceData[]> => {
      return appearanceService.getByChsName(chsName)
    },
  },

  // --- Content API (成分數據) ---
  ContentApi: {
    /** 獲取所有藥品成分數據，觸發快取邏輯。 */
    getAll: async (): Promise<ContentData[]> => {
      return contentService.getContentData()
    },
    /** 透過 ContentKey (複合鍵) 查詢單筆數據。 */
    getByContentKey: async (contentKey: string): Promise<ContentData | undefined> => {
      return contentService.getDataByContentKey(contentKey)
    },
    /** 依許可證號過濾所有成分記錄。 */
    filterByPermitNo: async (permitNo: string): Promise<ContentData[]> => {
      return contentService.getByPermitNo(permitNo)
    },
    /** 依成分名稱精確過濾。 */
    filterByContentName: async (contentName: string): Promise<ContentData[]> => {
      return contentService.getByContentName(contentName)
    },
  },

  // --- Labeling API (標籤/包裝數據) ---
  LabelingApi: {
    /** 獲取所有標籤數據。 */
    getAll: async (): Promise<LabelingData[]> => {
      return labelingService.getLabelingData()
    },
    /** 透過許可證號查詢單筆數據。 */
    getByPermitNo: async (permitNo: string): Promise<LabelingData | undefined> => {
      return labelingService.getByPermitNo(permitNo)
    },
    /** 依英文名稱精確過濾。 */
    filterByEngName: async (engName: string): Promise<LabelingData[]> => {
      return labelingService.getByEngName(engName)
    },
    /** 依中文名稱精確過濾。 */
    filterByChsName: async (chsName: string): Promise<LabelingData[]> => {
      return labelingService.getByChsName(chsName)
    },
  },

  // --- MainData API (主數據) ---
  MainDataApi: {
    /** 獲取所有藥品主數據。 */
    getAll: async (): Promise<MainData[]> => {
      return mainDataService.getMainData()
    },
    /** 透過 medicineId 查詢單筆數據。 */
    getByMedicineId: async (medicineId: string): Promise<MainData | undefined> => {
      return mainDataService.getByMedicineId(medicineId)
    },
    /** 依英文名稱精確過濾。 */
    filterByEngName: async (engName: string): Promise<MainData[]> => {
      return mainDataService.getByEngName(engName)
    },
    /** 依中文名稱精確過濾。 */
    filterByChsName: async (chsName: string): Promise<MainData[]> => {
      return mainDataService.getByChsName(chsName)
    },
    /** 依群組精確過濾。 */
    filterByGroup: async (group: string): Promise<MainData[]> => {
      return mainDataService.getByGroup(group)
    },
  },
}
