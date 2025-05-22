<template>
    <div class="app-container">
        <!-- 搜索和操作区域 -->
        <div class="filter-container">
            <el-date-picker v-model="listQuery.academicYear" type="academicYear" placeholder="选择年份" value-format="YYYY"
                style="width: 150px" @change="handleFilter" />
            <el-select v-model="listQuery.term" placeholder="学期" clearable style="width: 120px" @change="handleFilter">
                <el-option label="第一学期" :value="1" />
                <el-option label="第二学期" :value="2" />
            </el-select>
            <el-button class="filter-item" type="primary" @click="handleFilter">
                <el-icon>
                    <Search />
                </el-icon>
                搜索
            </el-button>
            <el-button class="filter-item" type="success" @click="handleCreate">
                <el-icon>
                    <Plus />
                </el-icon>
                新增校历
            </el-button>
            <el-button class="filter-item" type="warning" @click="showBatchDialog">
                <el-icon>
                    <Edit />
                </el-icon>
                批量设置
            </el-button>
        </div>

        <!-- 校历表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
            <el-table-column label="日期" prop="date" width="120">
                <template #default="{ row }">
                    {{ formatDate(row.date) }}
                </template>
            </el-table-column>
            <el-table-column label="学年" prop="academicYear" width="120" />
            <el-table-column label="学期" prop="term" width="100">
                <template #default="{ row }">
                    {{ row.term === 1 ? '第一学期' : '第二学期' }}
                </template>
            </el-table-column>
            <el-table-column label="日期类型" prop="dayType" width="120">
                <template #default="{ row }">
                    <el-tag :type="getDayTypeTagType(row.dayType)">
                        {{ getDayTypeName(row.dayType) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="描述" prop="description" />
            <el-table-column label="操作" width="180" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button type="primary" size="small" icon="Edit" @click="handleUpdate(row)">
                        编辑
                    </el-button>
                    <el-button type="danger" size="small" icon="Delete" @click="handleDelete(row)">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页组件 -->
        <pagination :total="total" :currentPage="listQuery.pageNum" :pageSize="listQuery.pageSize"
            @update:currentPage="listQuery.pageNum = $event" @update:pageSize="listQuery.pageSize = $event" @pagination="getList"/>

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="500px">
            <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="right" label-width="100px">
                <el-form-item label="学年" prop="academicYear">
                    <el-input v-model="temp.academicYear" placeholder="如:2023-2024" />
                </el-form-item>
                <el-form-item label="学期" prop="term">
                    <el-select v-model="temp.term" placeholder="请选择学期">
                        <el-option label="第一学期" :value="1" />
                        <el-option label="第二学期" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="日期" prop="date">
                    <el-date-picker v-model="temp.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"
                        style="width: 100%" />
                </el-form-item>
                <el-form-item label="日期类型" prop="dayType">
                    <el-select v-model="temp.dayType" placeholder="请选择日期类型">
                        <el-option label="工作日" :value="1" />
                        <el-option label="周末" :value="2" />
                        <el-option label="节假日" :value="3" />
                        <el-option label="调休工作日" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="temp.description" placeholder="如:国庆节" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogFormVisible = false">取消</el-button>
                <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
                    确认
                </el-button>
            </template>
        </el-dialog>

        <!-- 批量设置对话框 -->
        <el-dialog title="批量设置校历" v-model="batchDialogVisible" width="600px">
            <el-form ref="batchFormRef" :rules="batchRules" :model="batchTemp" label-position="right"
                label-width="100px">
                <el-form-item label="学年" prop="academicYear">
                    <el-input v-model="batchTemp.academicYear" placeholder="如:2023-2024" />
                </el-form-item>
                <el-form-item label="学期" prop="term">
                    <el-select v-model="batchTemp.term" placeholder="请选择学期">
                        <el-option label="第一学期" :value="1" />
                        <el-option label="第二学期" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="日期范围" prop="dateRange">
                    <el-date-picker v-model="batchTemp.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
                <el-form-item label="日期类型" prop="dayType">
                    <el-select v-model="batchTemp.dayType" placeholder="请选择日期类型">
                        <el-option label="工作日" :value="1" />
                        <el-option label="周末" :value="2" />
                        <el-option label="节假日" :value="3" />
                        <el-option label="调休工作日" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="batchTemp.description" placeholder="如:国庆节假期" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="batchDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleBatchSubmit">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination.vue'
import request from '@/api/request'
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn' // 如果需要中文
dayjs.locale('zh-cn') // 设置中文语言

// 数据列表相关
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
    pageNum: 1,
    pageSize: 20,
    academicYear: dayjs().format('YYYY'),
    term: undefined
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
    update: '编辑校历',
    create: '新增校历'
}
const temp = ref({
    id: undefined,
    academicYear: '',
    term: undefined,
    date: '',
    dayType: undefined,
    description: ''
})
const dataFormRef = ref()

// 批量设置相关
const batchDialogVisible = ref(false)
const batchTemp = ref({
    academicYear: '',
    term: undefined,
    dateRange: [],
    dayType: undefined,
    description: ''
})
const batchFormRef = ref()

// 表单验证规则
const rules = reactive({
    academicYear: [{ required: true, message: '学年不能为空', trigger: 'blur' }],
    term: [{ required: true, message: '学期不能为空', trigger: 'change' }],
    date: [{ required: true, message: '日期不能为空', trigger: 'change' }],
    dayType: [{ required: true, message: '日期类型不能为空', trigger: 'change' }]
})

const batchRules = reactive({
    academicYear: [{ required: true, message: '学年不能为空', trigger: 'blur' }],
    term: [{ required: true, message: '学期不能为空', trigger: 'change' }],
    dateRange: [{ required: true, message: '日期范围不能为空', trigger: 'change' }],
    dayType: [{ required: true, message: '日期类型不能为空', trigger: 'change' }]
})

// 获取校历列表
const getList = () => {
    listLoading.value = true
    const params = {
        pageNum: listQuery.pageNum,
        pageSize: listQuery.pageSize,
        academicYear: listQuery.academicYear,
        term: listQuery.term
    }

    request.post('/schoolCalendar/list', params)
        .then(response => {
            list.value = response.data.list
            total.value = response.data.total
        })
        .finally(() => {
            listLoading.value = false
        })
}

// 格式化日期
const formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD')
}

// 获取日期类型名称
const getDayTypeName = (dayType) => {
    const typeMap = {
        1: '工作日',
        2: '周末',
        3: '节假日',
        4: '调休工作日'
    }
    return typeMap[dayType] || ''
}

// 获取日期类型标签样式
const getDayTypeTagType = (dayType) => {
    const typeMap = {
        1: '',
        2: 'info',
        3: 'success',
        4: 'warning'
    }
    return typeMap[dayType] || ''
}

// 处理搜索
const handleFilter = () => {
    listQuery.pageNum = 1
    getList()
}

// 重置表单
const resetTemp = () => {
    temp.value = {
        id: undefined,
        academicYear: listQuery.academicYear || dayjs().format('YYYY'),
        term: undefined,
        date: '',
        dayType: undefined,
        description: ''
    }
}

// 处理新增
const handleCreate = () => {
    resetTemp()
    dialogStatus.value = 'create'
    dialogFormVisible.value = true
}

// 处理编辑
const handleUpdate = (row) => {
    temp.value = {
        id: row.id,
        academicYear: row.academicYear,
        term: row.term,
        date: row.date,
        dayType: row.dayType,
        description: row.description
    }
    dialogStatus.value = 'update'
    dialogFormVisible.value = true
}

// 创建数据
const createData = () => {
    dataFormRef.value.validate((valid) => {
        if (valid) {
            request.post('/schoolCalendar', temp.value)
                .then(() => {
                    dialogFormVisible.value = false
                    ElMessage.success('新增成功')
                    getList()
                })
        }
    })
}

// 更新数据
const updateData = () => {
    dataFormRef.value.validate((valid) => {
        if (valid) {
            request.post('/schoolCalendar', temp.value)
                .then(() => {
                    dialogFormVisible.value = false
                    ElMessage.success('更新成功')
                    getList()
                })
        }
    })
}

// 处理删除
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该校历记录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        request.delete(`/schoolCalendar/${row.id}`)
            .then(() => {
                ElMessage.success('删除成功')
                getList()
            })
    }).catch(() => { })
}

// 显示批量设置对话框
const showBatchDialog = () => {
    batchTemp.value = {
        academicYear: listQuery.academicYear || dayjs().format('YYYY'),
        term: undefined,
        dateRange: [],
        dayType: undefined,
        description: ''
    }
    batchDialogVisible.value = true
}

interface CalendarDTO {
    academicYear: string;
    term?: number;
    date: string;
    dayType?: number;
    description: string;
}

// 处理批量提交
const handleBatchSubmit = () => {
    batchFormRef.value.validate((valid) => {
        if (valid) {
            const [startDate, endDate] = batchTemp.value.dateRange
            const dtos: CalendarDTO[] = [];

            let currentDate = dayjs(startDate)
            const endDateObj = dayjs(endDate)

            while (currentDate.isBefore(endDateObj) || currentDate.isSame(endDateObj)) {
                dtos.push({
                    academicYear: batchTemp.value.academicYear,
                    term: batchTemp.value.term,
                    date: currentDate.format('YYYY-MM-DD'),
                    dayType: batchTemp.value.dayType,
                    description: batchTemp.value.description
                })
                currentDate = currentDate.add(1, 'day')
            }

            request.post('/schoolCalendar/batch', dtos)
                .then(() => {
                    batchDialogVisible.value = false
                    ElMessage.success('批量设置成功')
                    getList()
                })
        }
    })
}

// 初始化
onMounted(() => {
    getList()
})
</script>

<style lang="scss" scoped>
.app-container {
    padding: 20px;
}

.filter-container {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.el-table {
    margin-top: 20px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>