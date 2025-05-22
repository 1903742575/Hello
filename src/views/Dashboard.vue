<template>
  <div class="dashboard-container">
    <h1>值日检查统计分析</h1>

    <!-- 时间范围选择 -->
    <el-row :gutter="20" class="filter-container">
      <el-col :span="8">
        <el-date-picker v-model="timeRange" type="daterange" range-separator="至" start-placeholder="开始日期"
          end-placeholder="结束日期" @change="fetchStatistics" />
      </el-col>
      <el-col :span="4">
        <el-button-group>
          <el-button :type="activeTab === 'week' ? 'primary' : ''" @click="switchTab('week')">本周</el-button>
          <el-button :type="activeTab === 'month' ? 'primary' : ''" @click="switchTab('month')">本月</el-button>
        </el-button-group>
      </el-col>
    </el-row>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-title">检查总数</div>
            <div class="stat-value">{{ summary.totalChecks }}</div>
            <div class="stat-compare">
              <span :class="summary.checkTrend >= 0 ? 'up' : 'down'">
                <i :class="summary.checkTrend >= 0 ? 'el-icon-top' : 'el-icon-bottom'" />
                {{ Math.abs(summary.checkTrend) }}%
              </span>
              较上周
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-title">平均得分</div>
            <div class="stat-value">{{ summary.avgScore }}</div>
            <div class="stat-compare">
              <span :class="summary.scoreTrend >= 0 ? 'up' : 'down'">
                <i :class="summary.scoreTrend >= 0 ? 'el-icon-top' : 'el-icon-bottom'" />
                {{ Math.abs(summary.scoreTrend) }}%
              </span>
              较上周
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-title">完成率</div>
            <div class="stat-value">{{ summary.completionRate }}%</div>
            <div class="stat-compare">
              <span :class="summary.completionTrend >= 0 ? 'up' : 'down'">
                <i :class="summary.completionTrend >= 0 ? 'el-icon-top' : 'el-icon-bottom'" />
                {{ Math.abs(summary.completionTrend) }}%
              </span>
              较上周
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-title">问题数量</div>
            <div class="stat-value">{{ summary.issueCount }}</div>
            <div class="stat-compare">
              <span :class="summary.issueTrend <= 0 ? 'up' : 'down'">
                <i :class="summary.issueTrend <= 0 ? 'el-icon-top' : 'el-icon-bottom'" />
                {{ Math.abs(summary.issueTrend) }}%
              </span>
              较上周
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表展示 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">班级得分趋势</div>
          <div class="chart-container">
            <line-chart :chart-data="lineChartData" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">班级得分分布</div>
          <div class="chart-container">
            <bar-chart :chart-data="barChartData" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 排名表格 -->
    <el-card shadow="hover" class="ranking-card">
      <div slot="header">
        <span>{{ activeTab === 'week' ? '本周' : '本月' }}班级排名</span>
        <!-- <el-button type="text" @click="exportRanking">导出Excel</el-button> -->
      </div>
      <el-table :data="rankingData" border style="width: 100%">
        <el-table-column prop="rank" label="排名" width="80" />
        <el-table-column prop="className" label="班级" />
        <el-table-column prop="avgScore" label="平均分" sortable />
        <el-table-column prop="totalChecks" label="检查次数" sortable />
        <el-table-column prop="completionRate" label="完成率" sortable>
          <template #default="{ row }">
            {{ row.completionRate }}%
          </template>
        </el-table-column>
        <el-table-column label="趋势">
          <template #default="{ row }">
            <el-tag :type="row.trend >= 0 ? 'success' : 'danger'" size="small">
              <i :class="row.trend >= 0 ? 'el-icon-top' : 'el-icon-bottom'" />
              {{ Math.abs(row.trend) }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getWeekRange, getMonthRange } from '@/utils/date.js'
import request from '@/api/request'
import LineChart from '@/components/LineChart.vue'
import BarChart from '@/components/BarChart.vue'

// 类型定义
interface SummaryData {
  totalChecks: number
  avgScore: number
  completionRate: number
  issueCount: number
  checkTrend: number
  scoreTrend: number
  completionTrend: number
  issueTrend: number
}

interface ChartDataset {
  label?: string
  data: number[]
  backgroundColor?: string
  borderColor?: string
  fill?: boolean
}

interface CustomChartData {
  labels: string[]
  datasets: ChartDataset[]
}

interface RankingItem {
  rank: number
  className: string
  avgScore: number
  totalChecks: number
  completionRate: number
  trend: number
}

interface StatisticsResponse {
  summary: SummaryData
  trend: {
    labels: string[] // X轴标签（如日期）
    datasets: {
      label: string   // 数据集名称（如班级名称）
      data: number[]  // 数据点
      borderColor?: string
      backgroundColor?: string
    }[]
  }
  distribution: {
    labels: string[]
    values: number[]
  }
}

// 响应式数据
const activeTab = ref<'week' | 'month'>('week')
const timeRange = ref<[Date, Date]>([new Date(), new Date()])
const summary = ref<SummaryData>({
  totalChecks: 0,
  avgScore: 0,
  completionRate: 0,
  issueCount: 0,
  checkTrend: 0,
  scoreTrend: 0,
  completionTrend: 0,
  issueTrend: 0
})


const lineChartData = ref<CustomChartData>({
  labels: [],
  datasets: [{
    label: '班级得分趋势',
    data: [],
    borderColor: '#409EFF',
    backgroundColor: 'rgba(64, 158, 255, 0.1)',
    fill: true
  }]
})

const barChartData = ref<CustomChartData>({
  labels: [],
  datasets: [{
    label: '班级平均分',
    data: [],
    backgroundColor: '#409EFF'
  }]
})

const rankingData = ref<RankingItem[]>([])

// 方法
const initTimeRange = () => {
  if (activeTab.value === 'week') {
    timeRange.value = getWeekRange(new Date())
  } else {
    timeRange.value = getMonthRange(new Date())
  }
}

const switchTab = (tab: 'week' | 'month') => {
  activeTab.value = tab
  initTimeRange()
  fetchStatistics()
  fetchRanking()
}

const updateChartData = (response: StatisticsResponse) => {
  // 折线图：支持多条线
  lineChartData.value = {
    labels: response.trend.labels,
    datasets: response.trend.datasets.map(dataset => ({
      label: dataset.label || '未命名数据集',
      data: dataset.data,
      borderColor: dataset.borderColor || getRandomColor(), // 动态分配颜色
      backgroundColor: dataset.backgroundColor || 'rgba(0, 0, 0, 0.1)',
      fill: false,
      tension: 0.3
    }))
  }

  // 柱状图（保持不变）
  barChartData.value = {
    labels: response.distribution.labels,
    datasets: [{
      label: '班级平均分',
      data: response.distribution.values,
      backgroundColor: '#409EFF'
    }]
  }
}

// 辅助函数：生成随机颜色（用于区分多条线）
const getRandomColor = () => {
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
    '#337ecc', '#529b2e', '#b88230', '#c45656', '#73767a'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const fetchStatistics = async () => {
  try {
    const params = {
      startDate: formatDate(timeRange.value[0]),
      endDate: formatDate(timeRange.value[1])
    }
    const res = await request.get<StatisticsResponse>('/dashboard/statistics', { params })

    summary.value = res.data.summary

    updateChartData(res.data) // 应用updateChartData方法

  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

const fetchRanking = async () => {
  try {
    const params = {
      startDate: formatDate(timeRange.value[0]),
      endDate: formatDate(timeRange.value[1]),
      type: activeTab.value
    }
    const res = await request.get('/dashboard/ranking', { params })
    rankingData.value = res.data // 直接赋值data属性
  } catch (error) {
    console.error('获取排名数据失败:', error)
  }
}

// 辅助函数：格式化日期为 YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 生命周期
onMounted(() => {
  initTimeRange()
  fetchStatistics()
  fetchRanking()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;

  .filter-container {
    margin-bottom: 20px;
  }

  .stat-cards {
    margin-bottom: 20px;

    .stat-card {
      text-align: center;

      .stat-title {
        font-size: 14px;
        color: #909399;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin: 10px 0;
      }

      .stat-compare {
        font-size: 12px;
        color: #909399;

        .up {
          color: #67C23A;
        }

        .down {
          color: #F56C6C;
        }
      }
    }
  }

  .chart-row {
    margin-bottom: 20px;

    .chart-container {
      height: 300px;
    }
  }

  .ranking-card {
    margin-bottom: 20px;
  }
}
</style>