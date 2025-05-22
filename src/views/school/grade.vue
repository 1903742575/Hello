<template>
    <div class="app-container">
        <!-- 搜索和操作区域 -->
        <div class="filter-container">
            <el-input v-model="listQuery.className" placeholder="班级名称" style="width: 200px" class="filter-item"
                clearable @keyup.enter="handleFilter" />
            <el-input v-model="listQuery.classCode" placeholder="班级编码" style="width: 200px" class="filter-item"
                clearable @keyup.enter="handleFilter" />
            <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 120px" class="filter-item"
                @change="handleFilter">
                <el-option label="正常" :value="1" />
                <el-option label="禁用" :value="0" />
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
                新增班级
            </el-button>
        </div>

        <!-- 班级表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
            <el-table-column label="班级名称" prop="className" width="150" />
            <el-table-column label="班级编码" prop="classCode" width="120" />
            <el-table-column label="年级" prop="grade" width="100" />
            <el-table-column label="班主任" width="120">
                <template #default="{ row }">
                    {{ row.headTeacherName }}
                </template>
            </el-table-column>
            <el-table-column label="学生人数" prop="studentCount" width="100" align="center" />
            <el-table-column label="状态" prop="status" width="80" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                        {{ row.status === 1 ? '正常' : '禁用' }}
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
        <pagination v-show="total > 0" :total="total" :current-page="listQuery.pageNum" :page-size="listQuery.pageSize"
            @update:current-page="listQuery.pageNum = $event" @update:page-size="listQuery.pageSize = $event"
            @pagination="getList" />

        <!-- 新增/编辑对话框 -->
        <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
            <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="right" label-width="100px">
                <el-form-item label="班级名称" prop="className">
                    <el-input v-model="temp.className" placeholder="请输入班级名称" />
                </el-form-item>
                <el-form-item label="班级编码" prop="classCode">
                    <el-input v-model="temp.classCode" placeholder="请输入班级编码" />
                </el-form-item>
                <el-form-item label="年级" prop="grade">
                    <el-input v-model="temp.grade" placeholder="请输入年级" />
                </el-form-item>
                <el-form-item label="班主任" prop="headTeacherId">
                    <el-select v-model="temp.headTeacherId" placeholder="请选择班主任" filterable style="width: 100%">
                        <el-option v-for="teacher in teacherOptions" :key="teacher.id" :label="teacher.realName"
                            :value="teacher.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="学生人数" prop="studentCount">
                    <el-input-number v-model="temp.studentCount" :min="0" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="temp.status">
                        <el-radio :label="1">正常</el-radio>
                        <el-radio :label="0">禁用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="temp.description" type="textarea" placeholder="请输入班级描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogFormVisible = false">取消</el-button>
                <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
                    确认
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
    pageSize: 20,
    className: undefined,
    classCode: undefined,
    grade:'',
    status: undefined
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
    update: '编辑班级',
    create: '新增班级'
}
const temp = ref({
    id: undefined,
    className: '',
    classCode: '',
    grade: '',
    headTeacherId: undefined,
    studentCount: 0,
    description: '',
    status: 1
})
const dataFormRef = ref()

// 教师选项（用于班主任选择）
interface TeacherOption {
    id: number | bigint
    name: string
    realName: string
}

// 修正 teacherOptions 的定义
const teacherOptions = ref<TeacherOption[]>([])

// 表单验证规则
const rules = reactive({
    className: [
        { required: true, message: '班级名称不能为空', trigger: 'blur' },
        { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
    ],
    classCode: [
        { required: true, message: '班级编码不能为空', trigger: 'blur' },
        { max: 20, message: '长度不能超过20个字符', trigger: 'blur' }
    ],
    grade: [
        { required: true, message: '年级不能为空', trigger: 'blur' },
        { max: 20, message: '长度不能超过20个字符', trigger: 'blur' }
    ],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

// 获取班级列表
const getList = () => {
    listLoading.value = true
    request.post('/grades/list', listQuery)
        .then((response) => {
            list.value = response.data.list
            total.value = response.data.total
        })
        .finally(() => {
            listLoading.value = false
        })
}

// 获取教师列表（用于班主任选择）
const getTeacherOptions = () => {
    request.post('/users/list', {
        pageNum: 1,
        pageSize: 1000,
        userType: 2
    }).then((response) => {
        teacherOptions.value = response.data.list
    })
}

// 根据ID获取教师姓名
const getTeacherName = (teacherId) => {
    const teacher = teacherOptions.value.find((t) => t.id === teacherId)
    return teacher ? teacher.name : '-'
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
        className: '',
        classCode: '',
        grade: '',
        headTeacherId: undefined,
        studentCount: 0,
        description: '',
        status: 1
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
                .post('/grades', temp.value)
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
                .put('/grades', temp.value)
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
    ElMessageBox.confirm('确认删除该班级吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(() => {
            request.delete(`/grades/${row.id}`).then(() => {
                ElMessage.success('删除成功')
                getList()
            })
        })
        .catch(() => { })
}

// 初始化
onMounted(() => {
    getList()
    getTeacherOptions()
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