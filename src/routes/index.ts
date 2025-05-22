import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import Layout from '../components/Layout.vue';
import NoPermission from '../components/NoPermission.vue';
import Dashboard from '../views/Dashboard.vue';
import MenuList from '../views/menu/list.vue';
import RoleList from '../views/role/list.vue';
import UserList from '../views/user/list.vue';
import Settings from '../views/Settings.vue';

import Calendar from '../views/school/calendar.vue';
import Grade from '../views/school/grade.vue';
import Duty from '../views/school/duty.vue';
import Teacher from '../views/school/teacher.vue';
import DutyCheck from '../views/school/duty_check.vue';
import DutyDetail from '../views/school/duty_detail.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  {
    path: '/403',
    name: 'NoPermission',
    component: NoPermission,
    meta: { title: '无权限访问' }
  },
  {
    path: '/layout',
    component: Layout,
    children: [
      { path: 'menu_list', component: MenuList, meta: { title: '菜单管理' } },
      { path: 'role_list', component: RoleList, meta: { title: '角色管理' } },
      { path: 'user_list', component: UserList, meta: { title: '用户管理' } },
      { path: 'dashboard', component: Dashboard, meta: { title: '班级评分排名' } },
      { path: 'settings', component: Settings, meta: { title: '设置' } },
    ],
  },
  {
    path: '/school',
    component: Layout,
    children: [
      { path: 'calendar', component: Calendar, meta: { title: '校历管理' } },
      { path: 'grade', component: Grade, meta: { title: '班级管理' } },
      { path: 'duty', component: Duty, meta: { title: '值日管理', breadcrumb: true } },
      {
        path: 'duty_detail/:id',  // 添加 :id 参数
        name: 'DutyDetail',        // 添加路由名称
        component: DutyDetail,
        meta: { title: '检查详情', breadcrumb: true, parent: '/school/duty' }, // 添加面包屑导航
        props: true               // 将路由参数作为props传递
      },
      { path: 'duty_check', component: DutyCheck, meta: { title: '检查项目' } },
      { path: 'teacher', component: Teacher, meta: { title: '教师管理' } },
    ],
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  console.log(from);

  const token = localStorage.getItem('token');
  console.log('Token:', token); // 调试输出 token

  if (to.path !== '/login' && !token) {
    next('/login'); // 如果没有 token，跳转到登录页面
  } else {
    next(); // 允许跳转
  }
});

export default router;