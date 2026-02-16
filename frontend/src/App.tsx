
// React & Hooks
import { RouterProvider } from "react-router-dom";

// External Libraries
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Local
import appRouter from "./AppRoutes";
import { AuthUserProvider } from "./hooks/use-auth-user";
import { ThemeProvider } from "./hooks/use-theme";
import { I18nProvider, useI18n } from "./hooks/use-i18n";
import "./config/i18n.config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,// 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DevToolsWrapper() {
  const { direction } = useI18n();
  return (
    <ReactQueryDevtools 
      initialIsOpen={false} 
      buttonPosition={direction === 'rtl' ? 'bottom-right' : 'bottom-left'} 
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider defaultTheme="system" storageKey="app-theme">
          <AuthUserProvider>
            <RouterProvider router={appRouter} />
          </AuthUserProvider>
        </ThemeProvider>
        <DevToolsWrapper />
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
