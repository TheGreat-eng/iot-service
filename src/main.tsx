import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme as antdTheme, App as AntdApp } from 'antd' // ✅ THÊM App
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { FarmProvider } from './context/FarmContext'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppWithTheme() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#667eea',
            borderRadius: 8,
          },
        }}
      >
        {/* ✅ THÊM: Wrap trong AntdApp để dùng App.useApp() */}
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
    <AppWithTheme />
  </React.StrictMode>,
)
