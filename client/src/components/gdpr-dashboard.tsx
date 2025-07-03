import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Ban, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export function GdprDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  const exportConsents = () => {
    // Implementation for exporting consent records
    console.log("Exporting consent records...");
  };

  const manageBlacklist = () => {
    // Implementation for managing blacklist
    console.log("Managing blacklist...");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            GDPR Compliance Dashboard
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportConsents}
            >
              <Download className="mr-1 h-4 w-4" />
              Export Consents
            </Button>
            <Button
              size="sm"
              onClick={manageBlacklist}
            >
              <Ban className="mr-1 h-4 w-4" />
              Manage Blacklist
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Opted In</p>
                <p className="text-2xl font-semibold text-green-900">
                  {stats?.optedIn?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Blacklisted</p>
                <p className="text-2xl font-semibold text-red-900">
                  {stats?.blacklisted?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Consent</p>
                <p className="text-2xl font-semibold text-yellow-900">
                  {stats?.pending?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-1" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Dutch GDPR Compliance Notice
              </h4>
              <p className="text-sm text-blue-700">
                All contacts require explicit opt-in consent for marketing SMS. Automatic opt-out 
                links are included in all messages. Records of consent are maintained for audit 
                purposes as required by Dutch telecom regulations.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
