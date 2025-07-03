import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { processCSV } from "@/lib/csv-utils";
import { Users, CloudUpload, FileText, Edit, Download, Plus } from "lucide-react";

export function ContactManagement() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: contactLists } = useQuery({
    queryKey: ["/api/contact-lists"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ csvData, listName }: { csvData: string; listName?: string }) => {
      return apiRequest("POST", "/api/contacts/upload-csv", { csvData, listName });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `${data.contactsImported} contacts imported successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to import contacts. Please check your CSV format.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const csvData = await file.text();
      const listName = `Import ${new Date().toLocaleDateString()}`;
      await uploadMutation.mutateAsync({ csvData, listName });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/api/csv-template';
    link.download = 'contacts-template.csv';
    link.click();
  };

  const exportList = (listId: number) => {
    const link = document.createElement('a');
    link.href = `/api/contacts/export/${listId}`;
    link.download = `contacts-${listId}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Contact Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CSV Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop CSV file here, or
          </p>
          <div className="space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-2"
            >
              <FileText className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Choose CSV File"}
            </Button>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              size="sm"
            >
              Download Template
            </Button>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Contact Lists */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Contact Lists</h4>
          
          {contactLists?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No contact lists found. Upload a CSV file to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {contactLists?.map((list: any) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{list.name}</p>
                      <p className="text-xs text-gray-500">
                        {list.contactCount || 0} contacts • 
                        Updated {new Date(list.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportList(list.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
