<template>
    <div class="app-container">
        <!-- 搜索和操作区域 -->
        <div class="filter-container">
            <el-input v-model="listQuery.username" placeholder="用户名" style="width: 200px" class="filter-item" clearable
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
                新增
            </el-button>
        </div>

        <!-- 用户表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
            <el-table-column label="用户名" prop="username" />
            <el-table-column label="真实姓名" prop="realName" />
            <el-table-column label="手机号" prop="phone" />
            <el-table-column label="邮箱" prop="email" />
            <el-table-column label="用户类型" prop="userType" align="center">
                <template #default="scope">
                    {{ formatUserType(scope.row.userType) }}
                </template>
            </el-table-column>
            <el-table-column label="状态" prop="status" align="center">
                <template #default="scope">
                    <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                        {{ scope.row.status === 1 ? '正常' : '禁用' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
                <template #default="scope">
                    <el-button type="primary" size="small" icon="Edit" @click="handleUpdate(scope.row)">
                        编辑
                    </el-button>
                    <el-button type="danger" size="small" icon="Delete" @click="handleDelete(scope.row)">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <pagination :total="total" :currentPage="listQuery.pageNum" :pageSize="listQuery.pageSize"
            @update:currentPage="listQuery.pageNum = $event" @update:pageSize="listQuery.pageSize = $event"
            @pagination="getList" />

        <!-- 新增/编辑用户对话框 -->
        <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
            <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="right" label-width="100px">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="temp.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model="temp.password" type="password"
                        :placeholder="dialogStatus === 'update' ? '填写则更改密码' : '请输入密码'" show-password />
                </el-form-item>
                <el-form-item label="真实姓名" prop="realName">
                    <el-input v-model="temp.realName" placeholder="请输入真实姓名" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                    <el-input v-model="temp.phone" placeholder="请输入手机号" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="temp.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="用户类型" prop="userType">
                    <el-radio-group v-model="temp.userType">
                        <el-radio :label="1">管理员</el-radio>
                        <el-radio :label="2">教师</el-radio>
                        <el-radio :label="3">学生</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="用户角色" prop="roleId">
                    <el-select v-model="temp.roleId" placeholder="请选择角色" style="width: 100%">
                        <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="temp.status">
                        <el-radio :label="1">正常</el-radio>
                        <el-radio :label="0">禁用</el-radio>
                    </el-radio-group>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination.vue'
import request from '@/api/request'

// 数据列表相关
const list = ref([]);
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
    pageNum: 1,
    pageSize: 20,
    username: undefined
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
    update: '编辑用户',
    create: '新增用户'
}
const temp = ref({
    id: undefined,
    username: '',
    password: '',
    realName: '',
    phone: '',
    email: '',
    roleId: null,
    userType: 3, // 默认学生
    status: 1 // 默认正常
})
const dataFormRef = ref()

// 表单验证规则
const rules = reactive({
    username: [
        { required: true, message: '用户名不能为空', trigger: 'blur' },
        { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
    ],
    password: [
        {
            required: true, // 保持required为true以确保显示星号
            validator: (rule, value, callback) => {
                // 仅在创建模式验证必填
                if (dialogStatus.value === 'create' && !value) {
                    callback(new Error('密码不能为空'))
                } else if (value && (value.length < 6 || value.length > 20)) {
                    callback(new Error('长度在6到20个字符'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    userType: [
        { required: true, message: '请选择用户类型', trigger: 'change' }
    ],
    roleId: [
        { required: true, message: '请选择角色', trigger: 'change' }
    ]
})

// 获取用户列表
const getList = () => {
    listLoading.value = true
    request.post('/users/list', listQuery)
        .then(response => {
            list.value = response.data.list
            total.value = response.data.total
        })
        .finally(() => {
            listLoading.value = false
        })
}

// 格式化用户类型显示
const formatUserType = (type) => {
    const typeMap = {
        1: '管理员',
        2: '教师',
        3: '学生'
    }
    return typeMap[type]
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
        username: '',
        password: '',
        realName: '',
        phone: '',
        email: '',
        roleId: null,
        userType: 3,
        status: 1
    }
}

interface Role {
    id: number;
    roleName: string;
}

// 角色选项
const roleOptions = ref<Role[]>([])

// 获取角色列表
const getRoleOptions = async () => {
    try {
        const response = await request.post('/role/list', {
            pageNum: 1,
            pageSize: 1000,
        })
        roleOptions.value = response.data.list;
    } catch (error) {
        console.error('获取角色列表失败:', error)
    }
}

// 获取用户详情方法
const handleUpdate = (row) => {
    resetTemp()
    Promise.all([
        request.get(`/users/${row.id}`),
        getRoleOptions()
    ]).then(([userResponse]) => {
        userResponse.data.password = null; // 清空密码
        temp.value = {
            ...userResponse.data,
            roleId: userResponse.data.roleId // 确保包含角色ID
        }
        dialogStatus.value = 'update'
        dialogFormVisible.value = true
        nextTick(() => {
            dataFormRef.value?.clearValidate()
        })
    })
}

// 修改创建方法
const handleCreate = () => {
    resetTemp()
    getRoleOptions().then(() => {
        dialogStatus.value = 'create'
        dialogFormVisible.value = true
        nextTick(() => {
            dataFormRef.value?.clearValidate()
        })
    })
}

// 创建数据
const createData = () => {
    dataFormRef.value.validate((valid) => {
        if (valid) {
            request.post('/users/addUser', temp.value).then(() => {
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
            const payload = { ...temp.value };
            if (!payload.password) {
                delete (payload as any).password; // 如果密码为空，则不提交 password 字段
            }
            request.put('/users', temp.value).then(() => {
                dialogFormVisible.value = false
                ElMessage.success('更新成功')
                getList()
            })
        }
    })
}

// 处理删除
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该用户吗? 此操作将同时删除用户关联的角色', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        request.delete(`/users/${row.id}`).then(() => {
            ElMessage.success('删除成功')
            getList()
        })
    }).catch(() => { })
}

// 初始化时获取角色列表
onMounted(() => {
    getList()
    getRoleOptions()
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