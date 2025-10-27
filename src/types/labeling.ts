// 來源：labeling.json
export interface LabelingData {
  boxImgUrl: string
  labelingUrl: string
  chsName: string
  permitNo: string // **此欄位應該是唯一鍵（KeyPath）**
  engName: string
}
