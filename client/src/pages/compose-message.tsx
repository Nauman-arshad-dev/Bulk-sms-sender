import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScheduleModal } from "@/components/schedule-modal";
import { Edit, Send, Clock, Info, Save, Users, Eye } from "lucide-react";

const composeSchema = z.object({
  campaignName: z.string().min(1, "Campaign name is required"),
  listId: z.string().min(1, "Please select a contact list"),
  content: z.string().min(1, "Message content is required").max(160, "Message too long"),
});

type ComposeForm = z.infer<typeof composeSchema>;

export default function ComposeMessage() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ComposeForm | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState("John Doe");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const { toast } = useToast();

  const { data: contactLists = [] } = useQuery<any[]>({
    queryKey: ["/api/contact-lists"],
  });

  const form = useForm<ComposeForm>({
    resolver: zodResolver(composeSchema),
    defaultValues: {
      campaignName: "",
      listId: "",
      content: "",
    },
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    enabled: !!form.watch("listId"),
  });

  const sendMutation = useMutation({
    mutationFn: async (data: ComposeForm) => {
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = (data: ComposeForm) => {
    sendMutation.mutate(data);
  };

  const handleSchedule = (data: ComposeForm) => {
    setPendingMessage(data);
    setShowScheduleModal(true);
  };

  const watchedContent = form.watch("content");
  const watchedListId = form.watch("listId");
  const characterCount = watchedContent?.length || 0;
  
  const selectedList = contactLists.find((list: any) => list.id.toString() === watchedListId);
  const recipientCount = selectedList?.contactCount || 0;

  const getPreviewMessage = () => {
    return watchedContent?.replace(/{name}/g, selectedContactName) || "";
  };

  const [messageTemplates, setMessageTemplates] = useState([
    {
      name: "New Product Alert",
      content: "Hi {name}, we have new products from our latest import shipment. Check out our latest offers! Reply STOP to opt out.",
    },
    {
      name: "Special Offer",
      content: "Exclusive for {name}: 20% off all items this week! Visit our store or call us. Reply STOP to opt out.",
    },
    {
      name: "Weekly Newsletter",
      content: "Hello {name}, here's what's new this week at our store. Don't miss our weekend specials! Reply STOP to opt out.",
    },
  ]);

  const insertTemplate = (template: string) => {
    form.setValue("content", template);
  };

  const addTemplate = (name: string, content: string) => {
    setMessageTemplates(prev => [...prev, { name, content }]);
    toast({
      title: "Template added",
      description: "Your message template has been saved successfully.",
    });
  };

  const deleteTemplate = (index: number) => {
    setMessageTemplates(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Template deleted", 
      description: "The message template has been removed.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Compose Message</h1>
        <p className="text-gray-600">Create and send marketing messages to your contacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Message Composition */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="mr-2 h-5 w-5" />
                Message Composition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSend)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="campaignName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter campaign name..."
                            className="text-base"
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
                        <FormLabel>Contact List</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a contact list..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contactLists.map((list: any) => (
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
                        <FormLabel>Message Content</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="h-32 resize-none text-base"
                            placeholder="Type your message here..."
                          />
                        </FormControl>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-4">
                            <p className="text-sm text-gray-500 flex items-center">
                              <Info className="mr-1 h-3 w-3" />
                              Use {"{name}"} for personalization
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewMode(!previewMode)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              {previewMode ? "Edit" : "Preview"}
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">
                            {characterCount}/160 characters
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview Mode */}
                  {previewMode && watchedContent && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Preview for {selectedContactName}:</h4>
                      <p className="text-sm text-gray-900 bg-white p-3 rounded border">
                        {getPreviewMessage()}
                      </p>
                    </div>
                  )}

                  {/* Recipient Info */}
                  {selectedList && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-800">
                            Recipients: {recipientCount} contacts
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {selectedList.name}
                        </Badge>
                      </div>
                    </div>
                  )}

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
        </div>

        {/* Message Templates Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Message Templates</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  + Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messageTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => insertTemplate(template.content)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {template.name}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {template.content.substring(0, 80)}...
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(index);
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {messageTemplates.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No templates yet</p>
                    <p className="text-xs">Click "Add Template" to create one</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Keep messages under 160 characters for single SMS</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Always include opt-out instructions (Reply STOP)</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Use {"{name}"} for personalization</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Test with preview before sending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}
