<template>
  <div class="pagination-container">
    <el-pagination
      background
      :layout="layout"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    required: true,
    default: 0
  },
  currentPage: {
    type: Number,
    required: true,
    default: 1
  },
  pageSize: {
    type: Number,
    required: true,
    default: 10
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 30, 50]
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  }
})

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'pagination'])

const handleCurrentChange = (val: number) => {
  emit('update:currentPage', val)
  emit('pagination', { page: val, size: props.pageSize })
}

const handleSizeChange = (val: number) => {
  emit('update:pageSize', val)
  emit('pagination', { page: props.currentPage, size: val })
}
</script>

<style scoped>
.pagination-container {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}
</style>