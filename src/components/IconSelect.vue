<template>
    <div class="icon-select-container">
      <el-input
        v-model="searchText"
        placeholder="搜索图标"
        clearable
        @clear="handleSearchClear"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
  
      <div class="icon-list">
        <div
          v-for="icon in filteredIcons"
          :key="icon"
          class="icon-item"
          :class="{ 'icon-active': selectedIcon === icon }"
          @click="handleSelect(icon)"
        >
          <el-icon :size="20">
            <component :is="icon" />
          </el-icon>
          <span class="icon-name">{{ icon }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import * as ElementPlusIconsVue from '@element-plus/icons-vue'
  
  const emit = defineEmits(['selected'])
  
  // 所有Element Plus图标
  const allIcons = Object.keys(ElementPlusIconsVue)
  const searchText = ref('')
  const selectedIcon = ref('')
  
  // 过滤后的图标列表
  const filteredIcons = computed(() => {
    return allIcons.filter(icon => 
      icon.toLowerCase().includes(searchText.value.toLowerCase())
    )
  })
  
  // 选择图标
  const handleSelect = (icon) => {
    selectedIcon.value = icon
    emit('selected', icon)
  }
  
  // 清空搜索
  const handleSearchClear = () => {
    searchText.value = ''
  }
  </script>
  
  <style scoped>
  .icon-select-container {
    width: 100%;
    padding: 10px;
  }
  
  .icon-list {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 15px;
    margin-top: 15px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s;
  }
  
  .icon-item:hover {
    background-color: var(--el-color-primary-light-9);
  }
  
  .icon-active {
    background-color: var(--el-color-primary-light-8);
  }
  
  .icon-name {
    margin-top: 5px;
    font-size: 12px;
    text-align: center;
    word-break: break-all;
  }
  </style>