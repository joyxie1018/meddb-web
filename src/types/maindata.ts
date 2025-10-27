// 來源：maindata.json
export interface MainData {
  modify: string
  medicineId: string // **此欄位應該是唯一鍵（KeyPath）**
  engName: string
  chsName: string
  content: string
  specQty: string
  specUnit: string
  compType: string
  price: string
  effeDate: string
  endDate: string
  pharma: string
  plantName: string
  dosage: string
  category: string
  group: string
  atcCode: string
  payment: string
  medicineUrl: string
  paymentUrl: string
}
