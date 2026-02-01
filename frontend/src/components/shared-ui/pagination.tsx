
// React
import { useId, useMemo, useTransition } from "react";

// UI Components
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IListPaginationState } from "@shared/interfaces/api/response.interface";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface PaginationProps {
  datalength: number;
  pageSizeOptions?: number[];
  pagination: IListPaginationState
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  datalength,
  pageSizeOptions = [5, 10, 20, 30, 40, 50],
  pagination,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t, direction } = useI18n();

  // React 19: Memoized page size options for better performance
  const memoizedPageSizeOptions = useMemo(() => pageSizeOptions, [pageSizeOptions]);

  // React 19: Smooth pagination changes
  const handlePageChange = (page: number) => {
    startTransition(() => {
      onPageChange(page);
    });
  };

  const handleLimitChange = (limit: number) => {
    startTransition(() => {
      onLimitChange(limit);
    });
  };

  const ChevronLeft = direction === 'rtl' ? ChevronRightIcon : ChevronLeftIcon;
  const ChevronRight = direction === 'rtl' ? ChevronLeftIcon : ChevronRightIcon;
  const DoubleArrowLeft = direction === 'rtl' ? DoubleArrowRightIcon : DoubleArrowLeftIcon;
  const DoubleArrowRight = direction === 'rtl' ? DoubleArrowLeftIcon : DoubleArrowRightIcon;

  return (
    <div className={`flex items-center justify-between px-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`} data-component-id={componentId} dir={direction}>
      <div className="flex-1 text-sm text-muted-foreground">
        {datalength} {t('of')} {pagination.total} {t('row')}(s) {t('selected')}.
      </div>

      <div className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-6 lg:space-x-8`}>
        <div className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-2`}>
          <p className="text-sm font-medium">{buildSentence(t, 'rows', 'per', 'page')}</p>
          <Select
            value={`${pagination.limit}`}
            onValueChange={(value) => {
              handleLimitChange(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pagination.limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {memoizedPageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {t('page')} {pagination.page} {t('of')} {pagination.lastPage}
        </div>

        <div className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse' : ''} space-x-2`}>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => handlePageChange(1)}
            disabled={!pagination.hasPrevPage}
          >
            <span className="sr-only">{buildSentence(t, 'go', 'to', 'first', 'page')}</span>
            <DoubleArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            <span className="sr-only">{buildSentence(t, 'go', 'to', 'previous', 'page')}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            <span className="sr-only">{buildSentence(t, 'go', 'to', 'next', 'page')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => handlePageChange(pagination.lastPage)}
            disabled={!pagination.hasNextPage}
          >
            <span className="sr-only">{buildSentence(t, 'go', 'to', 'last', 'page')}</span>
            <DoubleArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
