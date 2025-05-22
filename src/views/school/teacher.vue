<template>
    <div class="app-container">
        <!-- 搜索区域 -->
        <div class="filter-container">
            <el-input v-model="listQuery.teacherName" placeholder="教师姓名" style="width: 200px" class="filter-item"
                clearable @keyup.enter="handleFilter" />
            <el-input v-model="listQuery.className" placeholder="班级名称" style="width: 200px" class="filter-item"
                clearable @keyup.enter="handleFilter" />
            <el-input v-model="listQuery.subject" placeholder="任教科目" style="width: 200px" class="filter-item" clearable
                @keyup.enter="handleFilter" />
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
                新增教师
            </el-button>
        </div>

        <!-- 教师表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
            <el-table-column label="教师姓名" prop="teacherName"/>
            <el-table-column label="任教班级" prop="className"/>
            <el-table-column label="任教科目" prop="subject"/>
            <el-table-column label="操作" width="300" align="center" fixed="right">
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
        <pagination v-show="total > 0" :total="total" :current-page="listQuery.pageNum" :page-size="listQuery.pageSize"
            @update:current-page="listQuery.pageNum = $event" @update:page-size="listQuery.pageSize = $event"
            @pagination="getList" />

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
            <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="right" label-width="100px">
                <el-form-item label="教师" prop="teacherId">
                    <el-select v-model="temp.teacherId" placeholder="请选择教师" filterable style="width: 100%"
                        :disabled="dialogStatus === 'update'">
                        <el-option v-for="teacher in teacherOptions" :key="teacher.id"
                            :label="teacher.realName || teacher.username" :value="teacher.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="班级" prop="classId">
                    <el-select v-model="temp.classId" placeholder="请选择班级" style="width: 100%">
                        <el-option v-for="cls in classOptions" :key="cls.id" :label="cls.className" :value="cls.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="任教科目" prop="subject">
                    <el-input v-model="temp.subject" placeholder="请输入任教科目" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogFormVisible = false">取消</el-button>
                <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
                    确认
                </el-button>
            </template>
        </el-dialog>

        <!-- 分配班级对话框 -->
        <el-dialog title="分配任教班级" v-model="assignDialogVisible" width="600px">
            <el-form ref="assignFormRef" :model="assignTemp" label-position="right" label-width="100px">
                <el-form-item label="教师">
                    <el-input :value="assignTemp.teacherName" disabled />
                </el-form-item>
                <el-form-item label="任教班级" prop="classIds">
                    <el-select v-model="assignTemp.classIds" multiple placeholder="请选择班级" style="width: 100%">
                        <el-option v-for="cls in classOptions" :key="cls.id" :label="cls.className" :value="cls.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="任教科目" prop="subject">
                    <el-input v-model="assignTemp.subject" placeholder="请输入任教科目" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="assignDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleAssignSubmit">
                    确认分配
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination.vue'
import request from '@/api/request'

// 数据列表相关
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
    pageNum: 1,
    pageSize: 10,
    teacherName: '',
    className: '',
    subject: ''
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('create')
const textMap = {
    update: '编辑教师',
    create: '新增教师'
}
const temp = ref({
    id: undefined,
    teacherId: undefined,
    classId: undefined,
    subject: ''
})
const dataFormRef = ref()

// 分配班级对话框相关
const assignDialogVisible = ref(false)
const assignTemp = ref({
    teacherId: undefined,
    teacherName: '',
    classIds: [],
    subject: ''
})
const assignFormRef = ref()

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

// 表单验证规则
const rules = reactive({
    teacherId: [{ required: true, message: '请选择教师', trigger: 'change' }],
    classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
    subject: [{ required: true, message: '请输入任教科目', trigger: 'blur' }]
})

// 获取教师列表
const getList = () => {
    listLoading.value = true
    request.post('/teachers/list', listQuery)
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
        const [teachersRes, classesRes] = await Promise.all([
            request.post('/users/list', {
                pageNum: 1,
                pageSize: 1000,
                userType: 2
            }),
            request.post('/grades/list', {
                pageNum: 1,
                pageSize: 1000,
                status: 1
            })
        ])
        teacherOptions.value = teachersRes.data.list
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
        teacherId: undefined,
        classId: undefined,
        subject: ''
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
    temp.value = Object.assign({}, row)
    dialogStatus.value = 'update'
    dialogFormVisible.value = true
}

// 创建数据
const createData = () => {
    dataFormRef.value.validate((valid) => {
        if (valid) {
            request
                .post('/teachers', temp.value)
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
                .put('/teachers', temp.value)
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
    ElMessageBox.confirm('确认删除该教师任教记录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(() => {
            request.delete(`/teachers/${row.id}`).then(() => {
                ElMessage.success('删除成功')
                getList()
            })
        })
        .catch(() => { })
}

// 显示分配班级对话框
const showAssignDialog = (row) => {
    assignTemp.value = {
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        classIds: row.classes.map(cls => cls.id),
        subject: row.subject || ''
    }
    assignDialogVisible.value = true
}

// 处理分配提交
const handleAssignSubmit = () => {
    request
        .post('/teachers/batchAssign', {
            teacherId: assignTemp.value.teacherId,
            classIds: assignTemp.value.classIds,
            subject: assignTemp.value.subject
        })
        .then(() => {
            assignDialogVisible.value = false
            ElMessage.success('分配成功')
            getList()
        })
}

// 初始化
onMounted(() => {
    getList()
    fetchOptions()
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