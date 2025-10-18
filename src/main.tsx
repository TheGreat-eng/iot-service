import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme as antdTheme, App as AntdApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { FarmProvider } from './context/FarmContext'
import { ThemeProvider, useTheme } from './context/ThemeContext' // ✅ THÊM
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// ✅ Component wrapper để sử dụng useTheme
function AppWithTheme() {
  const { isDark } = useTheme();

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#667eea',
            borderRadius: 8,
            // ✅ Custom colors cho dark mode
            ...(isDark && {
              colorBgContainer: '#1f1f1f',
              colorBgElevated: '#2a2a2a',
            }),
          },
        }}
      >
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <FarmProvider>
              <App />
            </FarmProvider>
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  </React.StrictMode>,
)
