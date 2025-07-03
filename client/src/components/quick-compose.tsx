import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Send, Clock, Info } from "lucide-react";
import { ScheduleModal } from "./schedule-modal";

const quickSendSchema = z.object({
  listId: z.string().min(1, "Please select a contact list"),
  content: z.string().min(1, "Message content is required").max(160, "Message too long"),
  campaignName: z.string().min(1, "Campaign name is required"),
});

type QuickSendForm = z.infer<typeof quickSendSchema>;

export function QuickCompose() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<QuickSendForm | null>(null);
  const { toast } = useToast();

  const { data: contactLists } = useQuery({
    queryKey: ["/api/contact-lists"],
  });

  const form = useForm<QuickSendForm>({
    resolver: zodResolver(quickSendSchema),
    defaultValues: {
      listId: "",
      content: "",
      campaignName: "",
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: QuickSendForm) => {
      const payload = {
        ...data,
        listId: parseInt(data.listId),
      };
      return apiRequest("POST", "/api/messages/quick-send", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickSend = (data: QuickSendForm) => {
    sendMutation.mutate(data);
  };

  const handleSchedule = (data: QuickSendForm) => {
    setPendingMessage(data);
    setShowScheduleModal(true);
  };

  const watchedContent = form.watch("content");
  const characterCount = watchedContent?.length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit className="mr-2 h-5 w-5" />
            Quick Compose
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleQuickSend)} className="space-y-4">
              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Enter campaign name..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Contact List</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a contact list..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactLists?.map((list: any) => (
                          <SelectItem key={list.id} value={list.id.toString()}>
                            {list.name} ({list.contactCount || 0} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="h-24 resize-none"
                        placeholder="Hi {name}, we have new products from our latest import shipment. Check out our latest offers!"
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500 flex items-center">
                        <Info className="mr-1 h-3 w-3" />
                        Use {"{name}"} for personalization
                      </p>
                      <p className="text-sm text-gray-500">
                        {characterCount}/160 characters
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={sendMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendMutation.isPending ? "Sending..." : "Send Now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const formData = form.getValues();
                    if (form.formState.isValid) {
                      handleSchedule(formData);
                    } else {
                      form.trigger();
                    }
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        messageData={pendingMessage}
        onScheduled={() => {
          setShowScheduleModal(false);
          setPendingMessage(null);
          form.reset();
        }}
      />
    </>
  );
}
