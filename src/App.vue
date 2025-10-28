<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 網頁樣式
const theme = ref('light')

// 頁面載入狀態
const router = useRouter()
const isPageLoading = ref(false)
const routePages = [
  { title: '藥品列表', path: '/list' },
  { title: '小試身手', path: '/test' },
]

// 切換網頁樣式
function switchTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// 在每次路由開始導航前
router.beforeEach((to, from, next) => {
  isPageLoading.value = true
  next()
})

// 在路由導航結束後 (包括異步組件載入完成後)
router.afterEach(() => {
  // 設置一個短延遲，讓載入動畫有時間顯示
  setTimeout(() => {
    isPageLoading.value = false
  }, 1000)
})

const backToHomePage = () => router.replace('/')
</script>

<template>
  <v-responsive class="border rounded">
    <v-app :theme="theme">
      <v-app-bar class="px-3">
        <v-app-bar-title class="medtitle cursor-pointer" @click="backToHomePage"
          >藥品資料庫</v-app-bar-title
        >
        <v-btn v-for="value in routePages" :text="value.title" :to="value.path" exact slim />
        <v-spacer></v-spacer>
        <v-btn
          :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          text="切換樣式"
          slim
          @click="switchTheme"
        ></v-btn>
      </v-app-bar>

      <v-main>
        <v-overlay
          :model-value="isPageLoading"
          class="align-center justify-center"
          persistent
          contained
          z-index="1000"
        >
          <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
        </v-overlay>
        <router-view />
      </v-main>
    </v-app>
  </v-responsive>
</template>
<style scoped>
:deep(.v-toolbar-title.medtitle) {
  flex: none;
  margin-inline-end: 20px;
}
</style>
