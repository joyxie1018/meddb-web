<template>
  <v-container class="fill-height d-flex align-center justify-center" max-width="900">
    <div class="w-100">
      <!-- <v-img class="mb-4" height="150" src="@/assets/logo.png" /> -->
      <v-icon
        class="mb-4 mx-auto d-block"
        height="150"
        color="info"
        icon="mdi mdi-pill-multiple"
        size="150"
      ></v-icon>
      <div class="mb-8 text-center">
        <div class="text-body-2 font-weight-light mb-3">Welcome to</div>
        <!-- <div class="text-body-2 font-weight-light mb-3">Medicine Database</div> -->
        <h1 class="text-h2 font-weight-bold">藥品資料庫</h1>
      </div>

      <v-row>
        <v-col v-for="link in links" :key="link.href" cols="12" md="6">
          <v-card
            append-icon="mdi-open-in-new"
            class="py-4"
            color="surface-variant"
            :href="link.href"
            :prepend-icon="link.icon"
            rel="noopener noreferrer"
            rounded="lg"
            :subtitle="link.subtitle"
            :title="link.title"
            variant="tonal"
          />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
const links = [
  {
    href: '/meddb-web/list',
    icon: 'mdi-text-box-outline',
    subtitle: '資料來源：政府資料開放平臺',
    title: '藥品列表',
  },
  {
    href: '/meddb-web/test',
    icon: 'mdi-star-circle-outline',
    subtitle: '藥品知識小測驗',
    title: '小試身手',
  },
  // {
  //   href: 'https://vuetifyjs.com/components/all',
  //   icon: 'mdi-widgets-outline',
  //   subtitle: 'Discover components in the API Explorer.',
  //   title: 'Components',
  // },
  // {
  //   href: 'https://discord.vuetifyjs.com',
  //   icon: 'mdi-account-group-outline',
  //   subtitle: 'Connect with Vuetify developers.',
  //   title: 'Community',
  // },
]
</script>
