import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useId, useMemo, useTransition } from "react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export interface MenuItem {
  id: string
  label: string
  checked: boolean
  children?: MenuItem[]
}

export interface AppTreeExpandableProps {
  items: MenuItem[]
  onSelectionChange?: (selectedId: string) => void
  onChange?: (selectedItemId: string) => void
  className?: string
  title?: string
  value?: string
}

export function AppTreeExpandable({
  items,
  onSelectionChange,
  onChange,
  className = "",
  value,
}: AppTreeExpandableProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const [internalItems, setInternalItems] = React.useState<MenuItem[]>(items)

  React.useEffect(() => {
    setInternalItems(items)
  }, [items])

  const updateSingleSelectionState = (items: MenuItem[], targetId: string): MenuItem[] => {
    const allUnchecked = uncheckAllItems(items)
    return updateItemById(allUnchecked, targetId, true)
  }

  const uncheckAllItems = (items: MenuItem[]): MenuItem[] => {
    return items.map((item) => {
      const updatedItem = { ...item, checked: false }
      if (item.children?.length) {
        updatedItem.children = uncheckAllItems(item.children)
      }
      return updatedItem
    })
  }

  const updateItemById = (items: MenuItem[], targetId: string, checked: boolean): MenuItem[] => {
    return items.map((item) => {
      if (item.id === targetId) {
        return { ...item, checked }
      } else if (item.children?.length) {
        return {
          ...item,
          children: updateItemById(item.children, targetId, checked),
        }
      }
      return item
    })
  }

  const findSelectedItemId = (items: MenuItem[]): string | null => {
    for (const item of items) {
      if (item.checked) return item.id
      if (item.children?.length) {
        const selectedChildId = findSelectedItemId(item.children)
        if (selectedChildId) return selectedChildId
      }
    }
    return null
  }

  const findPathToSelectedItem = (
    items: MenuItem[],
    targetId: string | null,
    currentPath: string[] = []
  ): string[] => {
    if (!targetId) return []
    for (const item of items) {
      if (item.id === targetId) return [...currentPath, item.id]
      if (item.children?.length) {
        const path = findPathToSelectedItem(item.children, targetId, [...currentPath, item.id])
        if (path.length > 0) return path
      }
    }
    return []
  }

  const selectedItemId = value || findSelectedItemId(internalItems)
  const pathToSelectedItem = findPathToSelectedItem(internalItems, selectedItemId)

  // React 19: Smooth selection changes
  const handleSelectionChange = (itemId: string) => {
    startTransition(() => {
      const updatedItems = updateSingleSelectionState(internalItems, itemId)
      setInternalItems(updatedItems)

      if (onSelectionChange) onSelectionChange(itemId)
      if (onChange) onChange(itemId)
    });
  }

  return (
    <div className={`w-full rounded-lg p-2 shadow-sm ${className}`} data-component-id={componentId}>
      <div className="space-y-2">
        <RadioGroup
          value={selectedItemId ?? ""}
          onValueChange={(value) => {
            if (value) handleSelectionChange(value)
          }}
        >
          {internalItems.map((item) => (
            <MenuItemRadio
              key={item.id}
              item={item}
              level={0}
              selectedItemId={selectedItemId}
              pathToSelectedItem={pathToSelectedItem}
              onSelect={handleSelectionChange}
            />
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

interface MenuItemRadioProps {
  item: MenuItem
  level: number
  selectedItemId: string | null
  pathToSelectedItem: string[]
  onSelect: (itemId: string) => void
}

function MenuItemRadio({ item, level, selectedItemId, pathToSelectedItem, onSelect }: MenuItemRadioProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isInPath = pathToSelectedItem.includes(item.id);
  const [manuallyCollapsed, setManuallyCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (isInPath && !isOpen && !manuallyCollapsed) {
      setIsOpen(true);
    }
  }, [isInPath, isOpen, manuallyCollapsed]);

  React.useEffect(() => {
    setManuallyCollapsed(false);
  }, [selectedItemId]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setManuallyCollapsed(true);
  };

  return (
    <div className={`rounded-md ${level > 0 ? "mt-2" : ""}`}>
      {hasChildren ? (
        <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
          <div className="flex items-center">
            <RadioGroupItem
              className="cursor-pointer"
              value={item.id}
              id={item.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item.id);
              }}
            />
            <CollapsibleTrigger
              className={`flex flex-1 items-center justify-between p-1.5 font-medium hover:bg-gray-50 ${
                isInPath && item.id !== selectedItemId ? "bg-primary/10 text-primary" : ""
              }`}
              asChild
            >
              <div>
                <label
                  htmlFor={item.id}
                  className={`cursor-pointer text-sm ${
                    isInPath && item.id !== selectedItemId ? "text-primary" : ""
                  }`}
                >
                  {item.label}
                </label>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="bg-gray-50/50 px-2.5 py-1">
            <div className="space-y-2">
              {item.children?.map((child) => (
                <MenuItemRadio
                  key={child.id}
                  item={child}
                  level={level + 1}
                  selectedItemId={selectedItemId}
                  pathToSelectedItem={pathToSelectedItem}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className={`flex items-center space-x-1 p-1.5 ${item.id === selectedItemId ? "bg-primary/10" : ""}`}>
          <RadioGroupItem className="cursor-pointer" value={item.id} id={item.id} />
          <label
            htmlFor={item.id}
            className={`cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
              item.id === selectedItemId ? "text-primary" : ""
            }`}
          >
            {item.label}
          </label>
        </div>
      )}
    </div>
  );
}

