import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Send, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  Filter
} from "lucide-react";

export default function DeliveryReports() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("7");

  const { data: messages, refetch } = useQuery({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
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
    const statusConfig = {
      completed: { className: "status-badge completed", icon: CheckCircle },
      sending: { className: "status-badge sending", icon: Send },
      pending: { className: "status-badge pending", icon: Clock },
      failed: { className: "status-badge failed", icon: XCircle },
      scheduled: { className: "status-badge scheduled", icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getProgress = (message: any) => {
    if (!message.totalRecipients) return 0;
    return ((message.sentCount || 0) / message.totalRecipients) * 100;
  };

  const getDeliveryRate = (message: any) => {
    if (!message.sentCount) return 0;
    return ((message.deliveredCount || 0) / message.sentCount) * 100;
  };

  const filteredMessages = messages?.filter((message: any) => {
    if (selectedStatus !== "all" && message.status !== selectedStatus) {
      return false;
    }
    
    // Filter by period (days)
    const daysAgo = parseInt(selectedPeriod);
    const messageDate = new Date(message.createdAt);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return messageDate >= cutoffDate;
  });

  const exportReport = () => {
    // Create CSV export
    const csvData = filteredMessages?.map((message: any) => ({
      campaign: message.campaignName,
      status: message.status,
      recipients: message.totalRecipients || 0,
      sent: message.sentCount || 0,
      delivered: message.deliveredCount || 0,
      failed: message.failedCount || 0,
      delivery_rate: getDeliveryRate(message).toFixed(1) + "%",
      created: new Date(message.createdAt).toLocaleDateString(),
    }));

    if (!csvData?.length) return;

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header as keyof typeof row] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `delivery-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Reports</h1>
              <p className="text-gray-600">Monitor SMS campaign performance and delivery statistics</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={exportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent Today</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.sentToday?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.deliveryRate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {messages?.filter((m: any) => m.status === 'sending').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.scheduled || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMessages?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No messages found for the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredMessages?.map((message: any) => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {message.campaignName}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {message.content}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(message.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {message.totalRecipients || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 max-w-24">
                            <Progress value={getProgress(message)} className="h-2" />
                          </div>
                          <span className="text-sm text-gray-900 min-w-0 flex-shrink-0">
                            {message.sentCount || 0}/{message.totalRecipients || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getDeliveryRate(message).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {message.deliveredCount || 0} delivered, {message.failedCount || 0} failed
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // View detailed report implementation
                            console.log("View details for message:", message.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
