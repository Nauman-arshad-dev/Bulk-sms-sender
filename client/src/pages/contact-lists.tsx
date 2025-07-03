import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Plus, Edit, Trash2, Download, Upload } from "lucide-react";

export default function ContactLists() {
  const [newListName, setNewListName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const { data: contactLists, isLoading } = useQuery({
    queryKey: ["/api/contact-lists"],
  });

  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/contact-lists", { name });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact list created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      setNewListName("");
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contact list.",
        variant: "destructive",
      });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/contact-lists/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact list deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact list.",
        variant: "destructive",
      });
    },
  });

  const handleCreateList = () => {
    if (newListName.trim()) {
      createListMutation.mutate(newListName.trim());
    }
  };

  const handleDeleteList = (id: number) => {
    if (confirm("Are you sure you want to delete this contact list?")) {
      deleteListMutation.mutate(id);
    }
  };

  const exportList = (id: number) => {
    const link = document.createElement("a");
    link.href = `/api/contacts/export/${id}`;
    link.download = `contacts-${id}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Lists</h1>
            <p className="text-gray-600">Manage your contact lists and recipients</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create List
          </Button>
        </div>
      </div>

      {/* Create List Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Contact List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Enter list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCreateList}
                disabled={!newListName.trim() || createListMutation.isPending}
              >
                {createListMutation.isPending ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewListName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contactLists?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contact lists</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new contact list.
            </p>
          </div>
        ) : (
          contactLists?.map((list: any) => (
            <Card key={list.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                  <Badge variant="secondary">
                    {list.contactCount || 0} contacts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {list.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportList(list.id)}
                      className="flex-1"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteList(list.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
