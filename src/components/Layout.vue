<template>
  <el-container class="layout-container">
    <!-- 左侧导航栏 -->
    <el-aside class="layout-aside">
      <div class="logo-area">
        <span>通用中小学值日管理系统</span>
      </div>
      <el-menu :default-active="activeMenu" class="el-menu-vertical" @select="handleMenuSelect"
        background-color="#001529" text-color="#b7c0cd" active-text-color="#ffffff">
        <!-- 只显示目录和菜单类型，不显示按钮 -->
        <template v-for="menu in menus" :key="menu.id">
          <!-- 有子菜单的菜单项 -->
          <el-sub-menu v-if="menu.menuType == 1 && menu.children && menu.children.length" :index="menu.path"
            :disabled="!menu.path">
            <template #title>
              <el-icon>
                <component :is="menu.icon" />
              </el-icon>
              <span>{{ menu.menuName }}</span>
            </template>
            <!-- 添加类型断言 -->
            <template v-for="item in menu.children" :key="item.id">
              <el-menu-item v-if="(item as Menu).menuType !== 3" :index="(item as Menu).path">
                <el-icon>
                  <component :is="(item as Menu).icon" />
                </el-icon>
                <span>{{ (item as Menu).menuName }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>

          <!-- 没有子菜单的菜单项 -->
          <el-menu-item v-else :index="menu.path" v-if="menu.menuType !== 3">
            <el-icon>
              <component :is="menu.icon" />
            </el-icon>
            <span>{{ menu.menuName }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主体内容 -->
    <el-container class="main-container">
      <el-header class="layout-header">
        <div class="header-content">
          <el-breadcrumb separator="/" class="breadcrumbs">
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
              {{ item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <div class="header-right">
            <el-dropdown trigger="click" placement="bottom-end">
              <div class="user-info">
                <el-avatar :size="36" :src="avatarUrl" />
                <span class="username">{{ username }}</span>
                <el-icon class="arrow-icon">
                  <ArrowDown />
                </el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="user-dropdown">
                  <el-dropdown-item @click="logout" class="logout-item">
                    <el-icon>
                      <SwitchButton />
                    </el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main class="content-wrapper">
        <div class="content-container">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const username = ref(localStorage.getItem('username') || '管理员');
const avatarUrl = ref(
  'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
);


// 当前激活的菜单
const activeMenu = ref(route.path);

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((r) => r.meta && r.meta.title);
  return matched.map((r) => r.meta.title);
});

interface Menu {
  id: number; // 菜单的唯一标识
  menuName: string; // 菜单名称
  menuType: number; // 菜单名称
  path: string; // 菜单路径
  icon?: string; // 菜单图标
  children?: Menu[]; // 子菜单，递归类型
}
// 菜单数据
const menus = ref<Menu[]>([]);

// 获取菜单数据
const fetchMenus = async () => {
  var storedMenus = localStorage.getItem("menus");
  if (storedMenus) {
    menus.value = JSON.parse(storedMenus).map((menu) => ({
      ...menu,
      icon: resolveIcon(menu.icon), // 动态解析图标
    }));
    console.log(menus.value);

  } else {
    console.error('菜单数据为空，请重新登录获取菜单');
  }
};

// 动态解析图标
const resolveIcon = (iconName: string) => {
  // 直接从全局组件中获取
  return iconName && ElementPlusIconsVue[iconName] ? ElementPlusIconsVue[iconName] : null
}

// 菜单选择事件 - 直接使用完整路径
const handleMenuSelect = (path: string) => {
  console.log('', path);
  if (path) {
    router.push(path)
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  router.push('/login');
};

// 在组件挂载时获取菜单数据
onMounted(() => {
  fetchMenus();
});
</script>

<style lang="scss" scoped>
.layout-container {
  overflow: hidden;
  background-color: #f5f7fa;

  .layout-aside {
    width: 220px !important;
    background-color: #001529;
    transition: width 0.3s;
    box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);

    .logo-area {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      background-color: #002140;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .el-menu-vertical {
      border-right: none;
      height: calc(100vh - 60px);

      .el-menu-item {
        height: 50px;
        line-height: 50px;
        margin: 4px 0;
        border-radius: 4px;
        transition: all 0.3s;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }

        &.is-active {
          background-color: var(--el-color-primary) !important;
        }

        .el-icon {
          font-size: 18px;
          margin-right: 8px;
        }
      }
    }
  }

  .main-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
  }

  .layout-header {
    height: 60px;
    padding: 0 24px;
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;

    .header-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .breadcrumbs {
        flex: 1;
        font-size: 20px;
        font-weight: bold;
      }

      .user-info {
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s;
        padding: 8px 12px;
        border-radius: 4px;

        &:hover {
          background-color: rgba(0, 0, 0, 0.025);

          .username {
            color: var(--el-color-primary);
          }

          .arrow-icon {
            transform: rotate(180deg);
          }
        }

        .username {
          margin: 0 8px;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.3s;
        }

        .arrow-icon {
          transition: transform 0.3s;
          font-size: 12px;
        }
      }
    }
  }

  .content-wrapper {
    padding: 20px;
    background-color: #f0f2f5;
    height: calc(100vh - 60px);
    overflow-y: auto;

    .content-container {
      background-color: #fff;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      min-height: 100%;
      padding: 20px;
    }
  }
}

// 下拉菜单样式
.user-dropdown {
  margin-top: 8px !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;

  .logout-item {
    display: flex;
    align-items: center;
    color: var(--el-color-danger);
    font-weight: 500;

    .el-icon {
      margin-right: 8px;
    }

    &:hover {
      background-color: rgba(245, 108, 108, 0.1);
    }
  }
}
</style>