import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Wifi, WifiOff, Smartphone, User } from "lucide-react";

export function Header() {
  const { data: gatewayStatus } = useQuery({
    queryKey: ["/api/gateway/status"],
    refetchInterval: 5000,
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <MessageSquare className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">SMS Bulk Sender</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Gateway Connection Status */}
            <div className="flex items-center space-x-2">
              {gatewayStatus?.connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">SMS Gateway Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">SMS Gateway Disconnected</span>
                </>
              )}
            </div>

            {/* SIM Provider */}
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {gatewayStatus?.simProvider || "No SIM"}
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Import Trader NL</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
