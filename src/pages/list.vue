<script lang="ts" setup>
// import appearanceJson from '../../public/data/appearance.json'
// import mainDataJson from '../../public/data/maindata.json'
// import labelingJson from '../../public/data/labeling.json'
import { ApiUtil } from '../api/apiUtil'
import type { AppearanceData, ContentData, LabelingData, MainData } from '../types'
// const appearanceData = ref<any[]>(appearanceJson)
// const labelingData = ref<any[]>(labelingJson as any[])
// const mainData = ref<any[]>(mainDataJson as any[])
interface DetailData extends AppearanceData {
  boxImgUrl?: string
  labelingUrl?: string
}

const appearanceData = ref<AppearanceData[]>([])
const labelingData = ref<LabelingData[]>([])
const mainData = ref<MainData[]>([])
const detailData = ref<Map<string, DetailData[]>>(new Map())
const search = ref('')
const isDialogOpen = ref(false)
const isTableLoading = shallowRef(false)
const headers = [
  { title: '藥品代號', align: 'start', sortable: false, key: 'medicineId' },
  {
    title: '健保碼',
    align: 'start',
    sortable: false,
    key: 'healthNo',
    value: (data: MainData) => getHealthNoByMedId(data.medicineId),
  },
  { title: '中文名稱', align: 'start', sortable: false, key: 'chsName' },
  { title: '英文名稱', align: 'start', sortable: false, key: 'engName' },
  { title: '劑型', align: 'start', sortable: false, key: 'dosage' },
  {
    title: '藥商',
    align: 'start',
    sortable: false,
    key: 'pharma',
    value: (data: MainData) => removeCoLtd(data.pharma),
  },
  { title: '備註', align: 'start', sortable: false, key: 'group' },
  { title: '藥品頁面', align: 'center', sortable: false, key: 'medicineUrl' },
  { width: 1, key: 'data-table-expand', align: 'end' },
]

const openUrl = (url: string): Window | null => window.open(url, '_blank')

const SEARCHABLE_KEYS = ['medicineId', 'chsName', 'engName', 'group']

// 過濾搜尋
const filteredItems = computed(() => {
  const query = search.value
  if (!query) {
    return mainData.value // 如果沒有查詢詞，返回所有數據
  }

  // 1. 處理查詢詞
  const queryWords = query
    .toString()
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  if (queryWords.length === 0) {
    return mainData.value
  }

  // 2. 執行 Array.filter (只會對每一行執行一次)
  return mainData.value.filter((item: MainData) => {
    // 3. 將所有指定欄位的值合併成一個大字串
    const searchableText = SEARCHABLE_KEYS.map((key) => {
      let text = item[key] ? item[key].toString().toLowerCase() : ''
      if (key === 'medicineId') text = getHealthNoByMedId(text)
      return text
    }).join(' ')

    // 4. 執行多條件匹配 (OR 邏輯 - 只要大字串中包含任一查詢詞)
    return queryWords.some((word) => searchableText.includes(word))
  })
})

const getHealthNoByMedId = (medId: string): string => medId.substring(2, 7)
const getHealthNoByPermitNo = (permitNo: string): string => {
  // 篩掉中文
  const allDigits = (permitNo.match(/\d/g) || []).join('')
  // 取後五碼
  return allDigits.slice(-5)
}
const removeCoLtd = (text: string): string => {
  // 正則表達式解釋:
  // /股份有限公司/: 匹配字面上的「股份有限公司」
  // .*/: 匹配其後方所有內容 (. 匹配任何字符, * 匹配零次或多次)
  // $: 匹配字串結尾
  const regex =
    /(藥品|化學製藥|製藥|藥廠|工業|股份有限公司|有限公司|企業|貿易|企業社|商行|公司|實業).*$/
  return text.replace(regex, '')
}

const getInfoByMedicineId = (medId: string) => {
  if (detailData.value.has(medId)) {
    return detailData.value.get(medId)
  }
  const healthNo = getHealthNoByMedId(medId)

  detailData.value.set(
    medId,
    appearanceData.value
      .filter((e) => healthNo === getHealthNoByPermitNo(e.permitNo))
      .map((e) => {
        const { labelingUrl, boxImgUrl } =
          labelingData.value.find((b) => b.permitNo === e.permitNo) || {}
        return {
          labelingUrl: labelingUrl,
          boxImgUrl: boxImgUrl,
          ...e,
        }
      })
  )
  return detailData.value.get(medId)
}

const formatGroup = (content: string) => {
  if (!content) return ''
  // 逗點換行
  return content.replace(/,/g, ',<br>')
}

function openDialog() {
  isDialogOpen.value = true
}

const loadDataSet = async <T>(apiCall: Promise<T[]>, targetRef: any): Promise<void> => {
  try {
    const data = await apiCall
    targetRef.value = data
  } catch (error) {
    console.error('載入失敗:', error)
    throw new Error('部分數據載入失敗') // 拋出錯誤以被 Promise.all 捕獲
  }
}

onMounted(async () => {
  isTableLoading.value = true
  const appearancePromise = loadDataSet(ApiUtil.AppearanceApi.getAll(), appearanceData)
  const labelingPromise = loadDataSet(ApiUtil.LabelingApi.getAll(), labelingData)
  const mainDataPromise = loadDataSet(ApiUtil.MainDataApi.getAll(), mainData)

  try {
    // 使用 Promise.all 等待所有異步載入完成
    await Promise.all([appearancePromise, labelingPromise, mainDataPromise])

    console.log('所有數據集初始載入完成，並已存入記憶體快取。')
  } catch (error) {
    // 如果任何一個 Promise 失敗，就會進入這裡
    console.error('數據初始載入過程中發生錯誤:', error)
  } finally {
    isTableLoading.value = false
  }
})
</script>

<template>
  <!-- <div class="w-100"> -->
  <v-container width="100%">
    <div class="text-h4 ms-5">藥品列表</div>
    <v-data-table
      :headers="headers"
      :items="filteredItems"
      density="compact"
      item-key="medicineId"
      item-value="medicineId"
      :items-per-page="25"
      :items-per-page-options="[25, 50, 100]"
      show-expand
      :loading="isTableLoading"
    >
      <template v-slot:loading>
        <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
      </template>
      <template v-slot:top>
        <v-text-field
          v-model="search"
          class="pa-2"
          label="請輸入關鍵字(健保碼、中英名稱) 空格可多條件搜尋"
        ></v-text-field>
      </template>

      <template v-slot:item.medicineUrl="{ value }">
        <v-btn variant="plain" color="primary" @click="openUrl(value)">點我前往</v-btn>
      </template>

      <template v-slot:item.group="{ value }">
        <span v-html="formatGroup(value)"></span>
      </template>

      <template v-slot:item.data-table-expand="{ internalItem, isExpanded, toggleExpand }">
        <v-btn
          :append-icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          :text="isExpanded(internalItem) ? '收起資訊' : '外觀資訊'"
          class="text-none"
          color="medium-emphasis"
          size="small"
          variant="text"
          width="105"
          border
          slim
          @click="toggleExpand(internalItem)"
        ></v-btn>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="py-2">
            <v-sheet
              rounded="lg"
              class="bg-red-lighten-4"
              border
              v-if="getInfoByMedicineId(item.medicineId)?.length === 0"
            >
              <div type="info" variant="outlined" class="text-center my-4">查無外觀資料。</div>
            </v-sheet>
            <v-sheet rounded="lg" border v-else>
              <v-table density="compact" class="bg-blue-lighten-4">
                <thead>
                  <tr>
                    <th class="text-center">形狀</th>
                    <th class="text-center">顏色</th>
                    <th class="text-center">刻痕</th>
                    <th class="text-center">尺寸</th>
                    <th class="text-center">特殊氣味</th>
                    <th class="text-center">外觀</th>
                    <th class="text-center">盒子外觀</th>
                  </tr>
                </thead>
                <tbody class="bg-blue-lighten-5">
                  <tr v-for="value in getInfoByMedicineId(item.medicineId)">
                    <td class="text-center">{{ value.shape }}</td>
                    <td class="text-center">{{ value.color }}</td>
                    <td class="text-center">{{ value.imprint }}</td>
                    <td class="text-center">{{ value.size }}</td>
                    <td class="text-center">{{ value.smell ? value.smell : '無' }}</td>
                    <td class="pa-2">
                      <v-img
                        :width="200"
                        aspect-ratio="1/1"
                        cover
                        :src="value.imgUrl"
                        @click="openDialog"
                        class="mx-auto cursor-pointer"
                        style="cursor: pointer"
                      ></v-img>

                      <v-dialog
                        v-model="isDialogOpen"
                        max-width="80vw"
                        @click:outside="isDialogOpen = false"
                      >
                        <v-card>
                          <v-img
                            :src="value.imgUrl"
                            contain
                            class="bg-grey-lighten-2"
                            alt="全尺寸圖片"
                          ></v-img>
                          <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="primary" @click="isDialogOpen = false">關閉</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-dialog>
                    </td>
                    <td class="text-center">
                      <v-btn
                        v-if="value.boxImgUrl"
                        variant="plain"
                        color="primary"
                        @click="openUrl(value.boxImgUrl)"
                        >點我查看</v-btn
                      >
                      <div v-else>
                        <div type="error" variant="outlined" class="text-center my-4">
                          查無盒子外觀資料。
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-sheet>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
  <!-- </div> -->
</template>
