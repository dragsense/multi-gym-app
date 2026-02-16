import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useId, useMemo } from "react";

interface TabContent {
  index: string;
  label: string;
  content: React.ReactNode;
}

interface AppTabsProps {
  tabs: TabContent[];
  defaultTab?: string;
}

export function AppTabs({
  tabs,
  defaultTab = "1",
}: AppTabsProps) {
  // React 19: Essential IDs
  const componentId = useId();

  // React 19: Memoized tabs for better performance
  const memoizedTabs = useMemo(() => tabs, [tabs]);

  return (
    <Tabs defaultValue={defaultTab} data-component-id={componentId}>
      <TabsList className="grid grid-cols-2">
        {memoizedTabs.map((tab, index) => (
          <TabsTrigger key={index} value={tab.index}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {memoizedTabs.map((tab, index) => (
        <TabsContent key={index} value={tab.index}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
