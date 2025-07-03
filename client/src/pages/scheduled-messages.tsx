import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, X, Eye, Calendar, Users, MessageSquare } from "lucide-react";

export default function ScheduledMessages() {
  const { toast } = useToast();

  const { data: scheduledMessages, isLoading } = useQuery({
    queryKey: ["/api/messages/scheduled"],
    refetchInterval: 30000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/messages/scheduled/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scheduled message cancelled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/scheduled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel scheduled message.",
        variant: "destructive",
      });
    },
  });

  const handleCancel = (id: number, campaignName: string) => {
    if (confirm(`Are you sure you want to cancel "${campaignName}"?`)) {
      cancelMutation.mutate(id);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getTimeUntil = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) return "Overdue";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center">
          <Clock className="mr-3 h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scheduled Messages</h1>
            <p className="text-gray-600">Manage your upcoming SMS campaigns</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scheduled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {scheduledMessages?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Due Today</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {scheduledMessages?.filter((msg: any) => {
                    const today = new Date().toDateString();
                    const msgDate = new Date(msg.scheduledAt).toDateString();
                    return today === msgDate;
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {scheduledMessages?.reduce((sum: number, msg: any) => sum + (msg.totalRecipients || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Messages List */}
      <div className="space-y-4">
        {scheduledMessages?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled messages</h3>
              <p className="text-gray-600 mb-4">
                You haven't scheduled any messages yet. Create a message and schedule it for later.
              </p>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Compose Message
              </Button>
            </CardContent>
          </Card>
        ) : (
          scheduledMessages?.map((message: any) => {
            const { date, time } = formatDateTime(message.scheduledAt);
            const timeUntil = getTimeUntil(message.scheduledAt);
            
            return (
              <Card key={message.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {message.campaignName}
                        </h3>
                        <Badge className="status-badge scheduled">
                          Scheduled
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Scheduled Date</p>
                          <p className="text-sm text-gray-900">{date}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Scheduled Time</p>
                          <p className="text-sm text-gray-900">{time}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Time Until Send</p>
                          <p className="text-sm text-gray-900 font-medium">{timeUntil}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-1">Message Preview</p>
                        <div className="bg-gray-50 p-3 rounded border text-sm text-gray-900">
                          {message.content}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{message.totalRecipients || 0} recipients</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Created {new Date(message.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // View details implementation
                          console.log("View details for message:", message.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(message.id, message.campaignName)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
