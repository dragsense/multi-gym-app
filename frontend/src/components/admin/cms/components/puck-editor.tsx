// External Libraries
import React, { useEffect, useState, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Puck } from "@measured/puck";
import type { Data, Config } from "@measured/puck";

// Components
import { config as baseConfig } from "@/lib/puck/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, CheckCircle2, Save } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

interface IPuckEditorProps {
  fieldName?: string;
  data?: Data;
  availableVariables?: string[];
}

export const PuckEditor = React.memo(function PuckEditor({
  fieldName = "content",
  data,
  availableVariables = [],
}: IPuckEditorProps) {
  const { setValue } = useFormContext();
  const { t } = useI18n();
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Enhance config with available variables for Variable component
  const config = useMemo<Config>(() => {
    // Always enhance Variable component if availableVariables is provided
    const enhancedComponents = { ...baseConfig.components };

    if (enhancedComponents.Variable) {
      const originalVariable = enhancedComponents.Variable;
      enhancedComponents.Variable = {
        ...originalVariable,
        fields: {
          ...originalVariable.fields,
          variable: availableVariables.length > 0
            ? {
              type: "select",
              label: "Variable",
              options: availableVariables.map((v) => ({ label: `{{${v}}}`, value: v })),
            }
            : {
              type: "text",
              label: "Variable",
            },
        },
      };
    }

    return {
      ...baseConfig,
      components: enhancedComponents,
    };
  }, [availableVariables]);

  // Initialize with proper Data type structure
  const [puckData, setPuckData] = useState<Data>(() => {
    const { content, root, zones } = data ?? {};
    return {
      content: Array.isArray(content) ? content : [],
      root: root || { props: {} },
      zones: zones || {},
    };

  });

  // Sync with form value when it changes externally
  useEffect(() => {
    if (data) {
      const { content, root, zones } = data;
      setPuckData({
        content: Array.isArray(content) ? content : [],
        root: root || { props: {} },
        zones: zones || {},
      });
    } else if (!data) {
      setPuckData({
        content: [],
        root: { props: {} },
        zones: {},
      });
    }
  }, [data]);

  // Update form value when puck data changes
  const handlePuckPublish = (data: Data) => {

    setPuckData(data);

    setValue(fieldName, JSON.stringify(data));
    setIsSaved(true);
    setHasChanges(false);

    // Reset saved state after 3 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };


  return (
    <>

      <div className="border rounded-lg overflow-auto w-full">
        {/* Status Bar */}
        <div className="border-b bg-muted/30 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSaved && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("contentSavedLocally") || "Content saved locally"}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {t("youCanNowSubmit") || "You can now submit the form"}
                </span>
              </div>
            )}
            {hasChanges && !isSaved && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <span className="text-sm font-medium">
                  {t("unsavedChanges") || "Unsaved changes"}
                </span>
              </div>
            )}
          </div>
        </div>

        {availableVariables.length > 0 && (
          <div className="border-b bg-muted/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {t("availableVariables") || "Available Variables"}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="secondary"
                    className="font-mono text-xs cursor-help"
                    title={`Use {{${variable}}} in your content`}
                  >
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        <Puck
          config={config}
          data={puckData}
          onPublish={handlePuckPublish}
          onChange={() => {
            setHasChanges(true);
            setIsSaved(false);
          }}
          renderHeaderActions={({ state }) => <Button
            type="button"
            onClick={() => handlePuckPublish(state?.data)}
            variant="default"
            size="sm"
            className="gap-2"
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4" />
            {t("saveLocal") || "Save Local"}
          </Button>}

        />
      </div>
    </>
  );
});
