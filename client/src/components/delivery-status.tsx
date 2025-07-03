import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/use-websocket";
import { BarChart3, RefreshCw, Eye, Pause } from "lucide-react";

export function DeliveryStatus() {
  const { data: messages, refetch } = useQuery({
    queryKey: ["/api/messages"],
    refetchInterval: 5000,
  });

  // Listen for real-time updates
  useWebSocket("/ws", {
    onMessage: (data) => {
      if (data.type === "deliveryUpdate") {
        refetch();
      }
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="status-badge completed">Completed</Badge>;
      case "sending":
        return <Badge className="status-badge sending">Sending</Badge>;
      case "pending":
        return <Badge className="status-badge pending">Pending</Badge>;
      case "failed":
        return <Badge className="status-badge failed">Failed</Badge>;
      case "scheduled":
        return <Badge className="status-badge scheduled">Scheduled</Badge>;
      default:
        return <Badge className="status-badge">{status}</Badge>;
    }
  };

  const getProgress = (message: any) => {
    if (!message.totalRecipients) return 0;
    return ((message.sentCount || 0) / message.totalRecipients) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Real-time Delivery Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No messages found
                  </td>
                </tr>
              ) : (
                messages?.map((message: any) => (
                  <tr key={message.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {message.campaignName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {message.content.substring(0, 50)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.totalRecipients || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(message.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 mr-3">
                          <Progress value={getProgress(message)} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-900">
                          {message.sentCount || 0}/{message.totalRecipients || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {message.status === "sending" && (
                          <Button variant="ghost" size="sm">
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
