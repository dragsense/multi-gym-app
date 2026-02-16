import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchMyOverdueTasks } from "@/services/task.api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "@/config/routes.config";

export function OverdueTasksIndicator() {
  const navigate = useNavigate();
  const { data: overdueTasks, isLoading } = useQuery({
    queryKey: ["overdue-tasks"],
    queryFn: fetchMyOverdueTasks,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading || !overdueTasks || overdueTasks.length === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="relative"
      onClick={() => navigate(`/${ADMIN_ROUTES.TASKS}?overdue=true`)}
    >
      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
      <span>Overdue Tasks</span>
      <Badge
        variant="destructive"
        className="ml-2 h-5 w-5 flex items-center justify-center p-0"
      >
        {overdueTasks.length}
      </Badge>
    </Button>
  );
}

