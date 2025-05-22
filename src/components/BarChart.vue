<template>
  <div class="chart-wrapper">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Chart, type ChartData, type ChartOptions, registerables } from 'chart.js'

// 注册必要的Chart.js组件
Chart.register(...registerables)

const props = defineProps<{
  chartData: ChartData<'bar'>
  options?: ChartOptions<'bar'>
}>()

const chartRef = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart<'bar'> | null>(null)

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    // 如果已有实例，先销毁
    if (chartInstance.value) {
      chartInstance.value.destroy()
    }
    
    chartInstance.value = new Chart(chartRef.value, {
      type: 'bar',
      data: props.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        ...props.options // 合并传入的额外配置
      }
    })
  }
}

onMounted(() => {
  initChart()
})

// 数据变化时更新图表
watch(
  () => props.chartData,
  (newData) => {
    if (chartInstance.value) {
      // 完全重新创建图表而不是更新，避免某些边界情况的问题
      initChart()
    }
  },
  { deep: true }
)

// 组件卸载时清理
onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 100%;
  min-height: 300px; /* 添加最小高度确保可见 */
  
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>