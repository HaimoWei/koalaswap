// App.tsx
// 功能：挂载 React Query、AuthProvider、Navigation 容器。
// 1) React Query（QueryClientProvider）：处理请求缓存/加载状态（后续联调很有用）
// 2) AuthProvider：管理登录 token（存/读/清除）
// 3) NavigationContainer：React Navigation 容器（真正渲染路由树）

// App.tsx 顶部
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { enableScreens } from 'react-native-screens';
enableScreens(false);

// App.tsx 顶部（开发期用，定位后可以删）

const client = new QueryClient();

export default function App() {
  return (
      <QueryClientProvider client={client}>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
  );
}
