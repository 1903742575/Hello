import { ref,Directive } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';

export { ref, ElMessage, Plus };
export type { FormInstance };


// 模拟获取用户权限列表
const userPermissions = ['system:menu:edit', 'system:menu:delete']; // 示例权限

// 自定义指令 v-permission
const permission: Directive = {
  mounted(el, binding) {
    const requiredPermissions = binding.value; // 指令绑定的权限值
    if (!requiredPermissions) return;

    // 检查用户是否有权限
    const hasPermission = requiredPermissions.some((perm: string) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      // 如果没有权限，移除元素
      el.parentNode?.removeChild(el);
    }
  },
};

export default permission;