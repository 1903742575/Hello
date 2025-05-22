<template>
    <div class="app-container">
        <!-- 搜索区域 -->
        <div class="filter-container">
            <el-input v-model="listQuery.name" placeholder="项目名称" style="width: 200px" class="filter-item"
                clearable @keyup.enter="handleFilter" />
            <el-select v-model="listQuery.type" placeholder="项目类型" style="width: 120px" class="filter-item" clearable>
                <el-option label="学生检查项" :value="1" />
                <el-option label="班级检查项" :value="2" />
            </el-select>
            <el-select v-model="listQuery.status" placeholder="状态" style="width: 120px" class="filter-item" clearable>
                <el-option label="禁用" :value="0" />
                <el-option label="启用" :value="1" />
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
                新增项目
            </el-button>
        </div>

        <!-- 检查项目表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
            <el-table-column label="项目名称" prop="name" />
            <el-table-column label="项目类型" width="120">
                <template #default="{ row }">
                    <el-tag :type="row.type === 1 ? '' : 'warning'">
                        {{ row.type === 1 ? '学生检查项' : '班级检查项' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="分值" prop="score" width="100" />
            <el-table-column label="描述" prop="description" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                        {{ row.status === 1 ? '启用' : '禁用' }}
                    </el-tag>
                </template>
            </el-table-column>
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
                <el-form-item label="项目名称" prop="name">
                    <el-input v-model="temp.name" placeholder="请输入项目名称" />
                </el-form-item>
                <el-form-item label="项目类型" prop="type">
                    <el-select v-model="temp.type" placeholder="请选择项目类型" style="width: 100%">
                        <el-option label="学生检查项" :value="1" />
                        <el-option label="班级检查项" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="分值" prop="score">
                    <el-input-number v-model="temp.score" :min="1" :max="100" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="temp.description" type="textarea" :rows="3" placeholder="请输入描述" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-switch v-model="temp.status" :active-value="1" :inactive-value="0" />
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
    pageSize: 10,
    name: '',
    type: null,
    status: null
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('create')
const textMap = {
    update: '编辑检查项目',
    create: '新增检查项目'
}
const temp = ref({
    id: undefined,
    name: '',
    type: 1,
    score: 5,
    description: '',
    status: 1
})
const dataFormRef = ref()

// 表单验证规则
const rules = reactive({
    name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
    score: [{ required: true, message: '请输入分值', trigger: 'blur' }]
})

// 获取检查项目列表
const getList = () => {
    listLoading.value = true
    request.post('/checkItems/list', listQuery)
        .then(response => {
            list.value = response.data.list
            total.value = response.data.total
        })
        .finally(() => {
            listLoading.value = false
        })
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
        name: '',
        type: 1,
        score: 5,
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
                .post('/checkItems', temp.value)
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
                .put('/checkItems', temp.value)
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
    ElMessageBox.confirm('确认删除该检查项目吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(() => {
            request.delete(`/checkItems/${row.id}`).then(() => {
                ElMessage.success('删除成功')
                getList()
            })
        })
        .catch(() => { })
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