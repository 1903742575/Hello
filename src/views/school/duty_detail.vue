<template>
  <div class="app-container">
    <!-- 基本信息 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>值日安排详情</span>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日期">
          <!-- 普通值日显示简单日期 -->
          <span v-if="detail.type === 1">{{ detail.date }}</span>
          <!-- 总值周显示下拉选择器 -->
          <el-select v-else v-model="selectedDate" placeholder="请选择日期" style="width: 200px">
            <el-option v-for="date in dateRangeOptions" :key="date" :label="date" :value="date" />
          </el-select>
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="detail.type === 1 ? '' : 'warning'">
            {{ detail.type === 1 ? '普通值日' : '总值周' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="教师">{{ detail.teacherName }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ detail.grade }}{{ detail.className }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === 1 ? 'success' : 'info'">
            {{ detail.status === 1 ? '已完成' : '未完成' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总分">
          <el-tag :type="getScoreTagType(detail.totalScore)">
            {{ detail.totalScore || 0 }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 检查记录 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>检查记录</span>
      </div>

      <el-table :data="checkRecords" border v-loading="loading">
        <el-table-column label="检查项目" prop="itemName" width="180" />
        <el-table-column label="检查结果" prop="checkResult" show-overflow-tooltip />
        <el-table-column label="得分" width="120">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.score)">
              {{ row.score || '未评分' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="照片" width="180">
          <template #default="{ row }">
            <div v-if="row.photoUrlList?.length" class="photo-preview">
              <el-image v-for="(url, index) in row.photoUrlList" :key="index" :src="url"
                :preview-src-list="row.photoUrlList" style="width: 50px; height: 50px; margin-right: 5px;" fit="cover"
                z-index="99999" />
            </div>
            <span v-else class="no-photo">无照片</span>
          </template>
        </el-table-column>
        <el-table-column label="检查时间" width="180">
          <template #default="{ row }">
            {{ row.checkTime || '暂未检查' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 返回按钮 -->
    <el-button type="primary" icon="Back" @click="goBack">
      返回
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

// ==================== 类型定义 ====================

interface DutyCheckRecord {
  id?: number
  arrangementId: number
  itemId: number
  classId: number
  checkResult?: string
  score?: number
  photoUrls?: string // 数据库存储的逗号分隔字符串
  photoUrlList?: string[] // 前端使用的分割后的数组
  checkTime: string
  teacherId: number
  teacherName?: string
  className?: string
  itemName?: string
}

interface DutyArrangementDetail {
  id?: number
  date: string
  endDate?: string
  teacherId: number
  type: number // 1: 普通值日, 2: 总值周
  classId?: number
  status: number // 0: 未完成, 1: 已完成
  checkItems?: string // 数据库存储的逗号分隔字符串
  checkItemIds?: number[] // 前端使用的分割后的数组
  teacherName?: string
  className?: string
  grade?: string
  checkRecords: DutyCheckRecord[]
  totalScore?: number // 统计字段
  checkedCount?: number // 统计字段
  totalItems?: number // 统计字段
}

// ==================== 数据定义 ====================
const loading = ref(false)

// 详情数据
const detail = ref<DutyArrangementDetail>({
  id: undefined,
  date: '',
  teacherId: 0,
  type: 1,
  status: 0,
  checkRecords: [],
  checkedCount: 0,
  totalItems: 0,
  totalScore: 0
})

// 检查项目选项
const checkRecords = ref<DutyCheckRecord[]>([])

// 新增响应式数据
const selectedDate = ref('') // 当前选中的日期
const dateRangeOptions = ref<string[]>([])

// ==================== 生命周期 ====================
onMounted(() => {
  fetchDetail()
})

// ==================== 数据获取 ====================
// 获取详情数据
const fetchDetail = async () => {
  try {
    loading.value = true
    const res = await request.get<DutyArrangementDetail>(`/duties/${id}`)

    // 转换数据格式
    detail.value = {
      ...res.data,
      checkItemIds: res.data.checkItems
        ? res.data.checkItems.split(',').map(Number)
        : []
    }
    getCheckRecords(res.data.id, res.data.date)  // 获取检查记录
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error('获取详情失败:', error)
  } finally {
    loading.value = false
  }
}



// 监听 selectedDate 变化
watch(selectedDate, (newDate) => {
  if (newDate && detail.value.id) {
    getCheckRecords(detail.value.id, newDate)
  }
})

const getCheckRecords = async (id, date) => {
  try {
    // 查询检查记录
    const recordsRes = await request.post(`/duties/listCheck`, {
      arrangementId: id,
      date: date
    })
    checkRecords.value = recordsRes.data;
    // 计算统计信息
    calculateStatistics()
  } catch (error) {
    ElMessage.error('获取检查记录失败')
    console.error('获取检查记录失败:', error)
  } finally {
    loading.value = false
  }
}


// ==================== 业务逻辑 ====================
// 返回上一页
const goBack = () => {
  router.back(); // 返回到上一页
};

// 计算统计信息
const calculateStatistics = () => {
  if (checkRecords.value?.length) {
    detail.value.totalScore = checkRecords.value.reduce(
      (sum, r) => sum + (r.score || 0), 0
    )
    detail.value.checkedCount = checkRecords.value.length
    detail.value.totalItems = checkRecords.value?.length || 0
  }
}

// 根据分数获取标签类型
const getScoreTagType = (score?: number) => {
  if (score === undefined || score === null) return 'info'
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}


// 计算日期范围选项
const generateDateRangeOptions = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return []

  const start = new Date(startDate)
  const end = new Date(endDate)
  const options: string[] = []

  // 确保开始日期不大于结束日期
  if (start > end) return []

  // 生成日期范围内的所有日期
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    options.push(formatDate(d))
  }
  return options
}

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 在获取详情数据后处理日期
watch(() => detail.value, (newVal) => {
  if (newVal.type === 2 && newVal.date && newVal.endDate) {
    dateRangeOptions.value = generateDateRangeOptions(newVal.date, newVal.endDate)
    console.log(selectedDate.value);
    
    if (!selectedDate.value) {
      selectedDate.value = dateRangeOptions.value[0]
    }
    // // 默认选中第一个日期
    // if (dateRangeOptions.value.length > 0) {
    //   selectedDate.value = dateRangeOptions.value[0]
    // }
  }
}, { deep: true, immediate: true })
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.el-table {
  position: relative;
}

/* 确保预览遮罩层足够高 */
:deep(.el-image-viewer__wrapper) {
  z-index: 99999 !important;
}

:deep(.el-table) {
  --el-table-index: auto;
}

.box-card {
  margin-bottom: 20px;
}

.photo-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.no-photo {
  color: #999;
  font-size: 12px;
}

.el-descriptions {
  margin-top: 20px;
}

.el-progress {
  width: 80%;
  display: inline-block;
}
</style>