<template>
    <div class="app-container">
        <!-- 搜索和操作区域 -->
        <div class="filter-container">
            <el-input v-model="listQuery.menuName" placeholder="菜单名称" style="width: 200px" class="filter-item" clearable
                @keyup.enter="handleFilter" />
            <el-select v-model="listQuery.menuType" placeholder="菜单类型" clearable style="width: 120px"
                class="filter-item">
                <el-option label="目录" value=1 />
                <el-option label="菜单" value=2 />
                <el-option label="按钮" value=3 />
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
                新增
            </el-button>
        </div>

        <!-- 菜单表格 -->
        <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%" row-key="id"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
            <el-table-column label="菜单名称">
                <template #default="scope">
                    <div>
                        <span>{{ scope.row.menuName }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="menuType" label="类型" align="center">
                <template #default="scope">
                    <el-tag :type="getMenuTypeTag(scope.row.menuType)">
                        {{ getMenuTypeText(scope.row.menuType) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="menuCode" label="菜单编码" width="150" />
            <el-table-column prop="path" label="路由路径" width="180" />
            <el-table-column prop="icon" label="图标" align="center">
                <template #default="scope">
                    <el-icon v-if="scope.row.icon" :size="18">
                        <component :is="scope.row.icon" />
                    </el-icon>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" align="center" />
            <el-table-column prop="status" label="状态" align="center">
                <template #default="scope">
                    <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0"
                        @change="handleStatusChange(scope.row)" />
                </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
                <template #default="scope">
                    <el-button type="primary" size="small" icon="Edit" @click="handleUpdate(scope.row)"
                        v-permission="['system:menu:edit']">
                        编辑
                    </el-button>
                    <el-button type="danger" size="small" icon="Delete" @click="handleDelete(scope.row)"
                        v-permission="['system:menu:delete']">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑菜单对话框 -->
        <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
            <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="right" label-width="100px">
                <el-form-item label="菜单类型" prop="menuType">
                    <el-radio-group v-model="temp.menuType" @change="handleMenuTypeChange">
                        <el-radio-button :value="1">目录</el-radio-button>
                        <el-radio-button :value="2">菜单</el-radio-button>
                        <el-radio-button :value="3">按钮</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="temp.menuType != 1" label="父级菜单" prop="parentId">
                    <el-tree-select v-model="temp.parentId" :data="filteredMenuTreeOptions" :props="treeProps"
                        check-strictly placeholder="选择父级菜单" style="width: 100%"
                        :disabled="temp.menuType === 3 && isButtonParent(temp.parentId)" />
                </el-form-item>
                <el-form-item label="菜单名称" prop="menuName">
                    <el-input v-model="temp.menuName" placeholder="请输入菜单名称" />
                </el-form-item>
                <el-form-item label="菜单编码" prop="menuCode">
                    <el-input v-model="temp.menuCode" placeholder="请输入菜单编码" />
                </el-form-item>
                <el-form-item label="路由路径" prop="path" v-if="temp.menuType !== 3">
                    <el-input v-model="temp.path" placeholder="请输入路由路径" />
                </el-form-item>
                <el-form-item label="组件路径" prop="component" v-if="temp.menuType === 2">
                    <el-input v-model="temp.component" placeholder="请输入组件路径" />
                </el-form-item>
                <el-form-item label="权限标识" prop="perms" v-if="temp.menuType === 3">
                    <el-input v-model="temp.perms" placeholder="请输入权限标识" />
                </el-form-item>
                <el-form-item label="图标" prop="icon" v-if="temp.menuType !== 3">
                    <el-popover placement="bottom-start" width="450" trigger="click">
                        <template #reference>
                            <el-input v-model="temp.icon" placeholder="点击选择图标" readonly>
                                <template #prefix>
                                    <el-icon v-if="temp.icon">
                                        <component :is="temp.icon" />
                                    </el-icon>
                                </template>
                            </el-input>
                        </template>
                        <icon-select @selected="selectedIcon" />
                    </el-popover>
                </el-form-item>
                <el-form-item label="显示排序" prop="sort">
                    <el-input-number v-model="temp.sort" controls-position="right" :min="0" />
                </el-form-item>
                <el-form-item label="是否显示" prop="visible" v-if="temp.menuType !== 3">
                    <el-radio-group v-model="temp.visible">
                        <el-radio :value="1">显示</el-radio>
                        <el-radio :value="0">隐藏</el-radio>
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
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import IconSelect from '@/components/IconSelect.vue'
import request from '@/api/request'

// 数据列表相关
const list = ref<MenuItem[]>([]);
const total = ref(0)
const listLoading = ref(true)
interface ListQuery {
    pageNum: number;
    pageSize: number;
    menuName?: string;
    menuType?: number | string; // 明确声明可以是 number 或 string
}
const listQuery = reactive<ListQuery>({
    pageNum: 1,
    pageSize: 20,
    menuName: undefined,
    menuType: undefined
})

// 对话框相关
const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
    update: '编辑菜单',
    create: '新增菜单'
}
const temp = ref({
    id: undefined,
    parentId: 0,
    menuName: '',
    menuCode: '',
    menuType: 1,
    path: '',
    component: '',
    perms: '',
    icon: '',
    sort: 0,
    visible: 1,
    status: 1
})
const dataFormRef = ref()
interface MenuItem {
    id: number | string;
    parentId: number | string;
    menuName: string;
    menuType: number;
    children?: MenuItem[];
    path: string;
    component: string;
    perms: string;
    icon: string;
    sort: number;
    visible: number;
    status: number;
}
const menuTreeOptions = ref<MenuItem[]>([]);
const treeProps = {
    value: 'id',
    label: 'menuName',
    children: 'children'
}

// 过滤掉按钮类型的菜单选项
const filteredMenuTreeOptions = computed(() => {
    const filterButtons = (menus: MenuItem[]): MenuItem[] => {
        return menus.filter(menu => menu.menuType !== 3).map(menu => ({
            ...menu,
            children: menu.children ? filterButtons(menu.children) : []
        }))
    }
    return filterButtons(menuTreeOptions.value)
})

// 检查父级菜单是否是按钮
const isButtonParent = (parentId: number | string) => {
    if (!parentId || parentId === 0) return false
    const findParent = (menus: MenuItem[], id: number | string): MenuItem | null => {
        for (const menu of menus) {
            if (menu.id === id) return menu
            if (menu.children) {
                const found = findParent(menu.children, id)
                if (found) return found
            }
        }
        return null
    }
    const parent = findParent(menuTreeOptions.value, parentId)
    return parent ? parent.menuType === 3 : false
}

// 表单验证规则
const rules = reactive({
    menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
    menuCode: [{ required: true, message: '菜单编码不能为空', trigger: 'blur' }],
    path: [{ required: true, message: '路由路径不能为空', trigger: 'blur' }],
    component: [{ required: true, message: '组件路径不能为空', trigger: 'blur' }],
    perms: [{ required: true, message: '权限标识不能为空', trigger: 'blur' }]
})

// 获取菜单列表
const getList = () => {
    listLoading.value = true
    request.post('/menu/list', listQuery)
        .then(response => {
            buildMenuTreeOptions(response.data.list)
            total.value = response.data.total
        })
        .finally(() => {
            listLoading.value = false
        })
}

// 构建树形结构数据
const buildMenuTreeOptions = (data: MenuItem[]) => {
    const map: Record<string | number, MenuItem> = {};
    const tree: MenuItem[] = [];
    data.forEach((item) => {
        map[item.id] = { ...item, children: [] };
    });
    console.log(data);

    data.forEach((item) => {
        if (item.parentId === 0) {
            tree.push(map[item.id]);
        } else if (map[item.parentId]) {
            map[item.parentId].children?.push(map[item.id]);
        } else {
            tree.push(map[item.id]);
        }
    });
    console.log('构建菜单树', tree);

    list.value = tree;
    menuTreeOptions.value = tree;
};

// 处理菜单类型变化
const handleMenuTypeChange = (type: number) => {
    if (type === 3 && isButtonParent(temp.value.parentId)) {
        temp.value.parentId = 0
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
        parentId: 0,
        menuName: '',
        menuCode: '',
        menuType: 1,
        path: '',
        component: '',
        perms: '',
        icon: '',
        sort: 0,
        visible: 1,
        status: 1
    }
}

// 处理新增
const handleCreate = () => {
    resetTemp()
    dialogStatus.value = 'create'
    dialogFormVisible.value = true
    nextTick(() => {
        dataFormRef.value.clearValidate()
    })
}

// 处理编辑
const handleUpdate = (row) => {
    temp.value = Object.assign({}, row)
    dialogStatus.value = 'update'
    dialogFormVisible.value = true
    nextTick(() => {
        dataFormRef.value.clearValidate()
    })
}

// 创建数据
const createData = () => {
    dataFormRef.value.validate((valid) => {
        if (valid) {
            request.post('/menu/add', temp.value).then(() => {
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
            request.put('/menu/update', temp.value).then(() => {
                dialogFormVisible.value = false
                ElMessage.success('更新成功')
                getList()
            })
        }
    })
}

// 处理删除
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该菜单吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        request.delete('/menu/delete/' + row.id).then(() => {
            ElMessage.success('删除成功')
            getList()
        })
    }).catch(() => { })
}

// 处理状态变更
const handleStatusChange = (row) => {
    request.put('/menu/update', { id: row.id, status: row.status }).then(() => {
        ElMessage.success('状态更新成功')
    })
}

// 选择图标
const selectedIcon = (iconName) => {
    temp.value.icon = iconName
}

// 获取菜单类型文本
const getMenuTypeText = (type) => {
    const typeMap = {
        1: '目录',
        2: '菜单',
        3: '按钮'
    }
    return typeMap[type] || ''
}

// 获取菜单类型标签颜色
const getMenuTypeTag = (type) => {
    const tagTypeMap = {
        1: 'success',
        2: 'primary',
        3: 'warning'
    }
    return tagTypeMap[type] || ''
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

:deep(.el-tree-select) {
    width: 100%;
}
</style>