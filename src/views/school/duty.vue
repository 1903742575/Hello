<template>
    <div class="app-container">
        <!-- 搜索区域 -->
        <div class="filter-container">
            <el-select v-model="listQuery.type" placeholder="值日类型" style="width: 120px" class="filter-item" clearable>
                <el-option label="普通值日" :value="1" />
                <el-option label="总值周" :value="2" />
            </el-select>
            <el-date-picker v-model="listQuery.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"
                style="width: 200px" class="filter-item" clearable />
            <el-input v-model="listQuery.teacherName" placeholder="教师姓名" style="width: 200px" class="filter-item"
                clearable @keyup.enter="handleFilter" />
            <el-input v-model="listQuery.className" placeholder="班级名称" style="width: 200px" class="filter-item"
                clearable @keyup.enter="handleFilter" />
            <el-select v-model="listQuery.status" placeholder="状态" style="width: 120px" class="filter-item" clearable>
                <el-option label="未完成" :value="0" />
                <el-option label="已完成" :value="1" />
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
                新增安排
            </el-button>
        </div>

        <!-- 值日安排表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
            <el-table-column label="日期">
                <template #default="{ row }">
                    <span v-if="row.type === 1">{{ row.date }}</span>
                    <span v-else>{{ row.date }} 至 {{ row.endDate }}</span>
                </template>
            </el-table-column>
            <el-table-column label="教师姓名" prop="teacherName" />
            <el-table-column label="班级名称">
                <template #default="{ row }">
                    {{ row.grade }} {{ row.className }}
                </template>
            </el-table-column>
            <el-table-column label="检查项目" width="120">
                <template #default="{ row }">
                    <el-button type="text" @click="showCheckItemsDialog(row.checkItemList)">
                        {{ row.checkItemList?.length || 0 }}项
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column label="值日类型">
                <template #default="{ row }">
                    <el-tag :type="row.type === 1 ? '' : 'warning'">
                        {{ row.type === 1 ? '普通值日' : '总值周' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'info'">
                        {{ row.status === 1 ? '已完成' : '未完成' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="300" align="center" fixed="right">
                <template #default="{ row }">
                    <!-- <el-button type="primary" size="small" icon="Edit" @click="handleUpdate(row)">
                        编辑
                    </el-button> -->
                    <el-button type="primary" size="small" icon="View" @click="handleDetail(row)">
                        详情
                    </el-button>
                    <el-button type="danger" size="small" icon="Delete" @click="handleDelete(row)">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <pagination v-show="total > 0" :total="total" :current-page="listQuery.pageNum" :page-size="listQuery.pageSize"
            @update:current-page="listQuery.pageNum = $event" @update:page-size="listQuery.pageSize = $event"
            @pagination="getList" />

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="700px">
            <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="right" label-width="100px">
                <el-form-item label="值日类型" prop="type">
                    <el-select v-model="temp.type" placeholder="请选择值日类型" style="width: 100%">
                        <el-option label="普通值日" :value="1" />
                        <el-option label="总值周" :value="2" />
                    </el-select>
                </el-form-item>

                <el-form-item label="日期" prop="date" v-if="temp.type === 1">
                    <el-date-picker v-model="temp.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"
                        style="width: 100%" />
                </el-form-item>

                <el-form-item label="日期范围" prop="dateRange" v-if="temp.type === 2">
                    <el-date-picker v-model="temp.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>

                <el-form-item label="教师" prop="teacherId">
                    <el-select v-model="temp.teacherId" placeholder="请选择教师" filterable style="width: 100%"
                        @change="handleTeacherChange">
                        <el-option v-for="teacher in teacherOptions" :key="teacher.id"
                            :label="teacher.realName || teacher.username" :value="teacher.id" />
                    </el-select>
                </el-form-item>

                <el-form-item label="班级" prop="classId">
                    <el-select v-model="temp.classId" placeholder="请选择班级" style="width: 100%"
                        :disabled="!temp.teacherId">
                        <el-option v-for="cls in classOptions" :key="cls.id" :label="cls.grade + cls.className"
                            :value="cls.id" />
                    </el-select>
                </el-form-item>

                <el-form-item label="检查项目" prop="checkItems">
                    <el-select v-model="temp.checkItems" multiple placeholder="请选择检查项目" style="width: 100%">
                        <el-option v-for="item in checkItemOptions" :key="item.id" :label="item.name"
                            :value="item.id" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogFormVisible = false">取消</el-button>
                <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
                    确认
                </el-button>
            </template>
        </el-dialog>

        <!-- 检查项目详情对话框 -->
        <el-dialog title="检查项目列表" v-model="checkItemsDialogVisible" width="50%">
            <el-table :data="currentCheckItems" border>
                <el-table-column prop="name" label="项目名称" />
                <el-table-column prop="type" label="类型" width="120">
                    <template #default="{ row }">
                        <el-tag :type="row.type === 1 ? '' : 'warning'">
                            {{ row.type === 1 ? '学生项' : '班级项' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="score" label="分值" width="100" />
                <el-table-column prop="description" label="描述" show-overflow-tooltip />
            </el-table>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination.vue'
import request from '@/api/request'
import { useRouter } from 'vue-router'
// 在setup中添加
const router = useRouter()

// 数据列表相关
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
    pageNum: 1,
    pageSize: 10,
    date: null,
    teacherName: '',
    className: '',
    type: null,
    status: null
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('create')
const textMap = {
    update: '编辑值日安排',
    create: '新增值日安排'
}
// 定义接口
interface DutyArrangementTemp {
    id?: number | bigint
    date: string | null
    teacherId?: number | bigint | null
    type: number
    classId?: number | bigint | null
    status: number,
    dateRange: string,
    checkItems: number[]
}

interface AssignTemp {
    date: string | null
    type: number
    teacherIds: (number | bigint)[]
    classId?: number | bigint | null
}

// 修改响应式数据定义
const temp = ref<DutyArrangementTemp>({
    id: undefined,
    date: null,
    teacherId: undefined,
    type: 1,
    classId: undefined,
    status: 0,
    dateRange: "",
    checkItems: []
})
const dataFormRef = ref()

const assignTemp = ref<AssignTemp>({
    date: null,
    type: 1,
    teacherIds: [],
    classId: undefined
})

// 教师选项类型
interface TeacherOption {
    id: number | bigint
    username: string
    realName?: string
    userType: number
    // 可以根据需要添加其他字段
}

// 班级选项类型
interface ClassOption {
    id: number | bigint
    className: string
    classCode: string
    grade: string
    // 可以根据需要添加其他字段
}
// 下拉选项
const teacherOptions = ref<TeacherOption[]>([])
const classOptions = ref<ClassOption[]>([])
// 检查项目类型定义
interface DutyCheckItem {
    id: number | bigint
    name: string
    type: number // 1: 学生检查项, 2: 班级检查项
    category?: number // 1: 日常检查, 2: 专项检查
    score: number
    description?: string
    status: number // 0: 禁用, 1: 启用
}
// 新增响应式数据
const teacherClassOptions = ref<ClassOption[]>([])
const checkItemOptions = ref<DutyCheckItem[]>([])
// 表单验证规则
const rules = reactive({
    date: [{ required: true, message: '请选择日期', trigger: 'change' }],
    teacherId: [{ required: true, message: '请选择教师', trigger: 'change' }],
    type: [{ required: true, message: '请选择值日类型', trigger: 'change' }],
    classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
    checkItems: [
        {
            required: true,
            validator: (rule, value, callback) => {
                if (!value || value.length === 0) {
                    callback(new Error('请至少选择一项检查项目'))
                } else {
                    callback()
                }
            },
            trigger: 'change'
        }
    ]
})

// 获取值日安排列表
const getList = () => {
    listLoading.value = true
    request.post('/duties/list', listQuery)
        .then(response => {
            list.value = response.data.list
            total.value = response.data.total
        })
        .finally(() => {
            listLoading.value = false
        })
}

// 获取教师和班级选项
const fetchOptions = async () => {
    try {
        const [teachersRes] = await Promise.all([
            request.post('/users/list', {
                pageNum: 1,
                pageSize: 1000,
                userType: 2
            })
        ])
        teacherOptions.value = teachersRes.data.list
    } catch (error) {
        console.error('获取选项失败:', error)
    }
}

const cetchOptions = async () => {
    try {
        const [classesRes] = await Promise.all([
            request.post('/grades/list',{
                pageNum: 1,
                pageSize: 1000,
                userType: 2
            })
        ])
        classOptions.value = classesRes.data.list
    } catch (error) {
        console.error('获取选项失败:', error)
    }
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
        date: null,
        teacherId: undefined,
        type: 1,
        classId: undefined,
        status: 0,
        dateRange: "",
        checkItems: []
    }
}

// 检查项目弹窗相关
const checkItemsDialogVisible = ref(false)
const currentCheckItems = ref<DutyCheckItem[]>([])

// 显示检查项目弹窗
const showCheckItemsDialog = async (itemList: []) => {
    if (!itemList?.length) {
        ElMessage.warning('没有检查项目')
        return
    }
    currentCheckItems.value = itemList
    checkItemsDialogVisible.value = true
}

// 获取教师关联班级
const handleTeacherChange = async (teacherId: number) => {
    if (!teacherId) {
        teacherClassOptions.value = []
        return
    }
    try {
        const res = await request.post(`/teachers/list`, {
            teacherId,
            pageNum: 1,
            pageSize: 1000
        })
        teacherClassOptions.value = res.data.list[0].classes || [];
        // 如果有班级，默认选中第一个班级
        if (teacherClassOptions.value.length > 0) {
            temp.value.classId = teacherClassOptions.value[0].id
        }
    } catch (error) {
        console.error('获取教师班级失败:', error)
        teacherClassOptions.value = []
    }
}

// 获取检查项目选项
const fetchCheckItems = async () => {
    try {
        const res = await request.post('/checkItems/list', {
            pageNum: 1,
            pageSize: 1000
        })
        checkItemOptions.value = res.data.list
    } catch (error) {
        console.error('获取检查项目失败:', error)
    }
}

// 处理新增
const handleCreate = () => {
    resetTemp()
    dialogStatus.value = 'create'
    dialogFormVisible.value = true
}

// 处理编辑
// const handleUpdate = (row) => {
//     row.checkItems = row.checkItemList.map((item) => item.id)
//     handleTeacherChange(row.teacherId);
//     temp.value = Object.assign({}, row)
//     dialogStatus.value = 'update'
//     dialogFormVisible.value = true
// }

// 跳转到详情页
const handleDetail = (row) => {
    router.push({
        name: 'DutyDetail', // 路由名称
        params: {
            id: row.id // 传递值日安排ID作为参数
        }
    })
}

// 创建数据方法
const createData = () => {
    dataFormRef.value.validate((valid) => {
        if (valid) {
            const params = {
                ...temp.value,
                // 处理日期范围
                endDate: temp.value.type === 2 ? temp.value.dateRange[1] : null,
                date: temp.value.type === 2 ? temp.value.dateRange[0] : temp.value.date,
                // 处理检查项目
                checkItems: temp.value.checkItems
            }

            request
                .post('/duties', params)
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
            request
                .put('/duties', temp.value)
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
    ElMessageBox.confirm('确认删除该值日安排吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(() => {
            request.delete(`/duties/${row.id}`).then(() => {
                ElMessage.success('删除成功')
                getList()
            })
        })
        .catch(() => { })
}

// 监听类型变化
watch(() => temp.value.type, (newVal) => {
    if (newVal === 2) {
        temp.value.classId = null
    }
})

// 监听分配类型变化
watch(() => assignTemp.value.type, (newVal) => {
    assignTemp.value.teacherIds = []
    if (newVal === 2) {
        assignTemp.value.classId = undefined
        // 总值周只能选一个教师
        if (assignTemp.value.teacherIds.length > 1) {
            assignTemp.value.teacherIds = [assignTemp.value.teacherIds[0]]
        }
    }
})

// 初始化
onMounted(() => {
    getList()
    fetchOptions()
    fetchCheckItems()
    cetchOptions()
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