# 🎨 KoalaSwap UI 组件系统使用指南

## 📖 概述

这套UI组件系统提供了统一的用户交互体验，包括Toast通知和确认对话框等全局组件。

## 🔔 Toast 通知系统

### 基本使用

```tsx
import { toast, toastSuccess, toastError, toastWarning, toastInfo } from "../store/overlay";

// 基础用法
toast("这是一条信息", "info", 3000);

// 便捷方法（推荐）
toastSuccess("操作成功！");           // 绿色成功提示，3秒后消失
toastError("操作失败，请重试");        // 红色错误提示，4秒后消失
toastWarning("请填写完整信息");        // 黄色警告提示，3.5秒后消失
toastInfo("这是一条提示信息");         // 蓝色信息提示，3秒后消失
```

### 特性

✅ **现代化设计**：参考Ant Design、Vercel等大厂设计规范
✅ **丰富动画**：流畅的进入/退出动画，支持手动关闭
✅ **智能定位**：右上角固定定位，不干扰用户操作
✅ **进度指示**：底部进度条显示剩余时间
✅ **类型图标**：每种类型都有对应的SVG图标
✅ **无障碍支持**：完整的ARIA标签和语义化结构

### 设计细节

- **成功**：绿色边框 + 勾选图标
- **错误**：红色边框 + X图标
- **警告**：黄色边框 + 感叹号图标
- **信息**：蓝色边框 + 信息图标

## ⚠️ 确认对话框

### 基本使用

```tsx
import { confirm } from "../store/overlay";

// 基础确认对话框
const handleDelete = async () => {
  if (await confirm("删除地址", "删除后不可恢复，确定删除吗？")) {
    // 用户点击了确认
    deleteAddress();
  }
  // 用户点击了取消或关闭，什么都不做
};
```

### 特性

✅ **Promise API**：async/await友好的API设计
✅ **背景模糊**：现代化的backdrop-blur效果
✅ **键盘支持**：ESC关闭，Enter确认
✅ **点击外部关闭**：用户体验友好
✅ **平滑动画**：缩放+渐显动画效果

## 🔄 与现有系统集成

### 1. 确保组件已注册

在你的根组件中确保包含了这些组件：

```tsx
// App.tsx 或 main.tsx
import { ToastContainer } from "./components/ui/ToastContainer";
import { ConfirmModal } from "./components/ui/ConfirmModal";

function App() {
  return (
    <div>
      {/* 你的应用内容 */}
      <Routes>...</Routes>

      {/* 全局UI组件 */}
      <ToastContainer />
      <ConfirmModal />
    </div>
  );
}
```

### 2. API一致性

**推荐**：使用语义化的便捷方法
```tsx
// ✅ 推荐 - 语义清晰
toastSuccess("地址添加成功");
toastError("网络请求失败");

// ❌ 不推荐 - 需要手动指定类型
toast("地址添加成功", "success");
```

### 3. 错误处理最佳实践

```tsx
// 在API调用中的使用
const createMutation = useMutation({
  mutationFn: createAddress,
  onSuccess: () => {
    toastSuccess("地址添加成功");
    // 其他成功逻辑...
  },
  onError: (error: any) => {
    // 优雅处理后端错误信息
    const message = error?.response?.data?.message || error.message || "操作失败";
    toastError(message);
  }
});
```

## 🎯 设计原则

### 1. **统一性**
所有toast使用相同的设计语言和动画效果

### 2. **非侵入性**
固定在右上角，不阻挡主要内容

### 3. **可访问性**
完整的ARIA标签，支持屏幕阅读器

### 4. **性能优化**
仅在有toast时渲染，自动清理过期项

## 📱 响应式适配

- **桌面端**：固定宽度，右上角显示
- **移动端**：自适应宽度，保持合适边距
- **平板端**：介于桌面和移动之间

## 🎨 主题定制

目前使用Tailwind CSS类名，支持：
- 深色/浅色主题切换
- 颜色系统定制
- 圆角和阴影调整

---

## 💡 使用建议

1. **成功操作**：用户完成重要操作时显示（保存、创建、删除等）
2. **错误处理**：网络错误、验证失败、权限不足等
3. **警告提醒**：表单验证、确认操作前的提醒
4. **信息提示**：状态更新、功能引导等

---

*这套组件系统参考了Ant Design、Chakra UI、Vercel等优秀设计系统的最佳实践。*