<template>
    <div class="app-container">
        <!-- 搜索和操作区域 -->
        <div class="filter-container">
            <el-input v-model="listQuery.roleName" placeholder="角色名称" style="width: 200px" class="filter-item" clearable
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

        <!-- 角色表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%">
            <el-table-column label="角色名称" prop="roleName" />
            <el-table-column label="角色编码" prop="roleCode" />
            <el-table-column label="描述" prop="description" />
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
            @update:currentPage="listQuery.pageNum = $event" @update:pageSize="listQuery.pageSize = $event" @pagination="getList"/>

        <!-- 新增/编辑角色对话框 -->
        <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
            <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="right" label-width="100px">
                <el-form-item label="角色名称" prop="roleName">
                    <el-input v-model="temp.roleName" placeholder="请输入角色名称" />
                </el-form-item>
                <el-form-item label="角色编码" prop="roleCode">
                    <el-input v-model="temp.roleCode" placeholder="请输入角色编码" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="temp.description" placeholder="请输入描述" type="textarea" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="temp.status">
                        <el-radio :label="1">正常</el-radio>
                        <el-radio :label="0">禁用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="菜单权限" prop="menuIds">
                    <el-tree ref="menuTreeRef" :data="menuTreeOptions" show-checkbox node-key="id" :props="treeProps"
                        :check-strictly="true" check-on-click-node highlight-current
                        style="max-height: 400px; overflow: auto;" />
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
    roleName: undefined
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
    update: '编辑角色',
    create: '新增角色'
}
const temp = ref({
    id: undefined,
    roleName: '',
    roleCode: '',
    description: '',
    status: 1,
    menuIds: []
})
const dataFormRef = ref()
const menuTreeRef = ref()
const menuTreeOptions = ref([])
const treeProps = {
    value: 'id',
    label: 'menuName',
    children: 'children'
}

// 表单验证规则
const rules = reactive({
    roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    roleCode: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }]
})

// 获取角色列表
const getList = () => {
    listLoading.value = true
    request.post('/role/list', listQuery)
        .then(response => {
            console.log(response);

            list.value = response.data.list
            total.value = response.data.total
        })
        .finally(() => {
            listLoading.value = false
        })
}

// 获取菜单树
const getMenuTree = () => {
    request.get('/role/menuTree').then(response => {
        menuTreeOptions.value = response.data
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
        roleName: '',
        roleCode: '',
        description: '',
        status: 1,
        menuIds: []
    }
    nextTick(() => {
        menuTreeRef.value?.setCheckedKeys([])
    })
}

// 处理新增
const handleCreate = () => {
    resetTemp()
    dialogStatus.value = 'create'
    dialogFormVisible.value = true
    nextTick(() => {
        dataFormRef.value?.clearValidate()
    })
}

// 处理编辑
const handleUpdate = (row) => {
    resetTemp()
    request.get(`/role/${row.id}`).then(response => {
        const role = response.data
        temp.value = {
            id: role.id,
            roleName: role.roleName,
            roleCode: role.roleCode,
            description: role.description,
            status: role.status,
            menuIds: role.sysMenus?.map(menu => menu.id) || []
        }
        dialogStatus.value = 'update'
        dialogFormVisible.value = true
        nextTick(() => {
            dataFormRef.value?.clearValidate()
            menuTreeRef.value?.setCheckedKeys(temp.value.menuIds)
        })
    })
}

// 创建数据
const createData = () => {
  dataFormRef.value.validate((valid) => {
    if (valid) {
      // 获取所有选中的节点（包括半选中的父节点）
      const checkedKeys = menuTreeRef.value?.getCheckedKeys() || []
      const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || []
      const menuIds = [...checkedKeys, ...halfCheckedKeys]
      
      request.post('/role/addRole', {
        ...temp.value,
        menuIds
      }).then(() => {
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
      // 获取所有选中的节点（包括半选中的父节点）
      const checkedKeys = menuTreeRef.value?.getCheckedKeys() || []
      const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || []
      const menuIds = [...checkedKeys, ...halfCheckedKeys]
      
      request.put('/role', {
        ...temp.value,
        menuIds
      }).then(() => {
        dialogFormVisible.value = false
        ElMessage.success('更新成功')
        getList()
      })
    }
  })
}

// 处理删除
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该角色吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        request.delete(`/role/${row.id}`).then(() => {
            ElMessage.success('删除成功')
            getList()
        })
    }).catch(() => { })
}

// 初始化
onMounted(() => {
    getList()
    getMenuTree()
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