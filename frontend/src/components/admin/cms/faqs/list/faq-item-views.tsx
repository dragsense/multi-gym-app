import { Edit, Trash2, MoreHorizontal, Eye, EyeOff } from "lucide-react";
import { useTransition } from "react";

// Types
import type { IFaq } from "@shared/interfaces/cms.interface";
import type { ColumnDef } from "@tanstack/react-table";

// Components
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IFaqItemViewsArgs {
  handleEdit?: (faq: IFaq, e?: React.MouseEvent) => void;
  handleDelete?: (faqId: string, e?: React.MouseEvent) => void;
  handleToggleEnabled?: (faq: IFaq, e?: React.MouseEvent) => void;
  componentId?: string;
  t: (key: string) => string;
}

export const faqItemViews = ({
  handleEdit,
  handleDelete,
  handleToggleEnabled,
  componentId = "faq-item-views",
  t,
}: IFaqItemViewsArgs) => {
  const [, startTransition] = useTransition();

  // Table columns - not used but required for type
  const columns: ColumnDef<IFaq>[] = [];

  const FaqListItem = ({
    item,
    handleEdit,
    handleDelete,
    handleToggleEnabled,
  }: {
    item: IFaq;
    handleEdit?: (faq: IFaq, e?: React.MouseEvent) => void;
    handleDelete?: (faqId: string, e?: React.MouseEvent) => void;
    handleToggleEnabled?: (faq: IFaq, e?: React.MouseEvent) => void;
  }) => {
    return (
      <AppCard className="mb-4" data-component-id={componentId}>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={item.id} className="border-none">
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1 text-left hover:no-underline py-2">
                <div className="flex items-center gap-3 flex-1">
                  {handleToggleEnabled && <Badge variant={item.enabled ? "default" : "secondary"}>
                    {item.enabled ? buildSentence(t, "enabled") : buildSentence(t, "disabled")}
                  </Badge>}
                  <span className="font-medium">{item.question}</span>
                </div>
              </AccordionTrigger>
              {(handleEdit || handleDelete || handleToggleEnabled) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {handleEdit && (
                      <DropdownMenuItem onClick={(e) => handleEdit(item, e)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {buildSentence(t, "edit")}
                      </DropdownMenuItem>
                    )}
                    {handleToggleEnabled && (
                      <DropdownMenuItem onClick={(e) => handleToggleEnabled(item, e)}>
                        {item.enabled ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            {buildSentence(t, "disable")}
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            {buildSentence(t, "enable")}
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {handleDelete && (
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {buildSentence(t, "delete")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <AccordionContent>
              <div 
                className="text-sm text-muted-foreground prose prose-sm max-w-none pt-2"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </AppCard>
    );
  };

  return {
    columns,
    listItem: (
      item: IFaq,
      handleEdit?: (faq: IFaq, e?: React.MouseEvent) => void,
      handleDelete?: (faqId: string, e?: React.MouseEvent) => void,
      handleToggleEnabled?: (faq: IFaq, e?: React.MouseEvent) => void,
    ) => (
      <FaqListItem
        item={item}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleToggleEnabled={handleToggleEnabled}
      />
    ),
  };
};
