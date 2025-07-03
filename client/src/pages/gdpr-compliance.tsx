import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  Download, 
  Ban, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Search,
  UserX,
  FileText,
  Eye,
  Trash2
} from "lucide-react";

export default function GdprCompliance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showBlacklistForm, setShowBlacklistForm] = useState(false);
  const [newBlacklistPhone, setNewBlacklistPhone] = useState("");
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const blacklistMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest("POST", `/api/contacts/${contactId}/blacklist`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contact blacklisted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to blacklist contact.",
        variant: "destructive",
      });
    },
  });

  const exportConsents = () => {
    const consentData = contacts
      ?.filter((contact: any) => contact.optedIn)
      ?.map((contact: any) => ({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        consent_date: contact.consentDate ? new Date(contact.consentDate).toISOString() : '',
        opted_in: 'Yes',
        blacklisted: contact.blacklisted ? 'Yes' : 'No',
      }));

    if (!consentData?.length) {
      toast({
        title: "No Data",
        description: "No consent records found to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(consentData[0]);
    const csvContent = [
      headers.join(','),
      ...consentData.map(row => headers.map(header => row[header as keyof typeof row] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gdpr-consents-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Consent records exported successfully!",
    });
  };

  const filteredContacts = contacts?.filter((contact: any) => {
    if (!searchTerm) return true;
    return (
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const optedInContacts = filteredContacts?.filter((contact: any) => contact.optedIn && !contact.blacklisted) || [];
  const blacklistedContacts = filteredContacts?.filter((contact: any) => contact.blacklisted) || [];
  const pendingContacts = filteredContacts?.filter((contact: any) => !contact.optedIn && !contact.blacklisted) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="mr-3 h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GDPR Compliance</h1>
              <p className="text-gray-600">Manage consent records and compliance requirements</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={exportConsents}>
              <Download className="mr-2 h-4 w-4" />
              Export Consents
            </Button>
            <Button onClick={() => setShowBlacklistForm(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Manage Blacklist
            </Button>
          </div>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-green-800">Opted In</p>
                <p className="text-2xl font-semibold text-green-900">
                  {stats?.optedIn?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-700">Active consent records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-red-800">Blacklisted</p>
                <p className="text-2xl font-semibold text-red-900">
                  {stats?.blacklisted?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-red-700">Opted out or blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Consent</p>
                <p className="text-2xl font-semibold text-yellow-900">
                  {stats?.pending?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-yellow-700">Requires explicit consent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GDPR Notice */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-blue-600 mr-4 mt-1" />
            <div>
              <h4 className="text-lg font-medium text-blue-800 mb-3">
                Dutch GDPR Compliance Requirements
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                <p>
                  • <strong>Explicit Consent:</strong> All contacts must provide clear, explicit consent for marketing SMS
                </p>
                <p>
                  • <strong>Opt-out Mechanism:</strong> Every message must include instructions to unsubscribe (Reply STOP)
                </p>
                <p>
                  • <strong>Record Keeping:</strong> Maintain detailed records of consent with timestamps for audit purposes
                </p>
                <p>
                  • <strong>Data Rights:</strong> Contacts can request access, modification, or deletion of their data
                </p>
                <p>
                  • <strong>Telecom Compliance:</strong> Adherence to Dutch telecommunications authority (ACM) regulations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Blacklist Form */}
          {showBlacklistForm && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
              <h4 className="font-medium text-red-800 mb-3">Add to Blacklist</h4>
              <div className="flex space-x-3">
                <Input
                  placeholder="Enter phone number..."
                  value={newBlacklistPhone}
                  onChange={(e) => setNewBlacklistPhone(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    // Find contact by phone and blacklist
                    const contact = contacts?.find((c: any) => c.phone === newBlacklistPhone);
                    if (contact) {
                      blacklistMutation.mutate(contact.id);
                      setNewBlacklistPhone("");
                      setShowBlacklistForm(false);
                    } else {
                      toast({
                        title: "Error",
                        description: "Contact not found with that phone number.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!newBlacklistPhone}
                >
                  Add to Blacklist
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBlacklistForm(false);
                    setNewBlacklistPhone("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Contact Lists Tabs */}
          <div className="space-y-6">
            {/* Opted In Contacts */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Opted In Contacts ({optedInContacts.length})
              </h3>
              <div className="bg-white border rounded-lg">
                <div className="max-h-64 overflow-y-auto">
                  {optedInContacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No opted-in contacts found
                    </div>
                  ) : (
                    <table className="min-w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Consent Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {optedInContacts.map((contact: any) => (
                          <tr key={contact.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.phone}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {contact.consentDate ? new Date(contact.consentDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => blacklistMutation.mutate(contact.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <UserX className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Blacklisted Contacts */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <XCircle className="mr-2 h-5 w-5 text-red-600" />
                Blacklisted Contacts ({blacklistedContacts.length})
              </h3>
              <div className="bg-white border rounded-lg">
                <div className="max-h-64 overflow-y-auto">
                  {blacklistedContacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No blacklisted contacts found
                    </div>
                  ) : (
                    <table className="min-w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Blacklisted Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {blacklistedContacts.map((contact: any) => (
                          <tr key={contact.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.phone}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(contact.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="destructive">Blacklisted</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Consent */}
            {pendingContacts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                  Pending Consent ({pendingContacts.length})
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    These contacts have not provided explicit consent and cannot receive marketing messages.
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    {pendingContacts.map((contact: any) => (
                      <div key={contact.id} className="text-sm text-yellow-900 py-1">
                        {contact.name} - {contact.phone}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
