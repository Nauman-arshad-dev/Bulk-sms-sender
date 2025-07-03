import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const scheduleSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageData: any;
  onScheduled: () => void;
}

export function ScheduleModal({ 
  open, 
  onOpenChange, 
  messageData, 
  onScheduled 
}: ScheduleModalProps) {
  const { toast } = useToast();

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      date: "",
      time: "",
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      const scheduledAt = new Date(`${data.date}T${data.time}`);
      
      const payload = {
        ...messageData,
        listId: parseInt(messageData.listId),
        scheduledAt: scheduledAt.toISOString(),
      };

      return apiRequest("POST", "/api/messages/schedule", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message scheduled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/scheduled"] });
      onScheduled();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSchedule = (data: ScheduleForm) => {
    scheduleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Message</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSchedule)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={scheduleMutation.isPending}
              >
                {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
