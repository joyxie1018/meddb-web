// 來源：content.json
export interface ContentData {
  unit: string
  contentDesc: string
  contentName: string
  permitNo: string // **此欄位應該是唯一鍵（KeyPath）**
  content: string
  contentNo: string
  rx: string
  contentKey: string // 複合鍵用
}
