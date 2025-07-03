import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Signal, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  HardDrive,
  Usb,
  Radio
} from "lucide-react";

export default function SmsGatewaySetup() {
  const [connectionAttempting, setConnectionAttempting] = useState(false);

  const { data: gatewayStatus = {
    connected: false,
    signalStrength: 0,
    simProvider: null,
    queueLength: 0
  }, refetch } = useQuery<any>({
    queryKey: ["/api/gateway/status"],
    refetchInterval: 5000,
  });

  // Listen for real-time gateway updates
  useWebSocket("/ws", {
    onMessage: (data) => {
      if (data.type === "gatewayStatus") {
        refetch();
      }
    },
  });

  const getSignalBars = (strength: number) => {
    if (strength >= 20) return 5;
    if (strength >= 15) return 4;
    if (strength >= 10) return 3;
    if (strength >= 5) return 2;
    if (strength > 0) return 1;
    return 0;
  };

  const getSignalColor = (strength: number) => {
    if (strength >= 15) return "text-green-600";
    if (strength >= 10) return "text-yellow-600";
    if (strength >= 5) return "text-orange-600";
    return "text-red-600";
  };

  const handleRefresh = () => {
    setConnectionAttempting(true);
    refetch().finally(() => {
      setTimeout(() => setConnectionAttempting(false), 2000);
    });
  };

  const SignalBars = ({ strength }: { strength: number }) => {
    const bars = getSignalBars(strength);
    const colorClass = getSignalColor(strength);
    
    return (
      <div className="flex items-end space-x-1">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`w-1 bg-gray-300 ${
              bar <= bars ? colorClass.replace('text-', 'bg-') : ''
            }`}
            style={{ height: `${bar * 3 + 2}px` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SMS Gateway Setup</h1>
              <p className="text-gray-600">Configure and monitor your SMS gateway hardware</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={connectionAttempting}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${connectionAttempting ? 'animate-spin' : ''}`} />
            {connectionAttempting ? 'Checking...' : 'Check Status'}
          </Button>
        </div>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              {gatewayStatus?.connected ? (
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 mr-4" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Gateway Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {gatewayStatus?.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">SIM Provider</p>
                <p className="text-lg font-semibold text-gray-900">
                  {gatewayStatus?.simProvider || 'No SIM'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Signal className={`h-8 w-8 mr-4 ${getSignalColor(gatewayStatus?.signalStrength || 0)}`} />
              <div>
                <p className="text-sm font-medium text-gray-600">Signal Strength</p>
                <div className="flex items-center space-x-2">
                  <SignalBars strength={gatewayStatus?.signalStrength || 0} />
                  <span className="text-lg font-semibold text-gray-900">
                    {gatewayStatus?.signalStrength || 0}/31
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Hardware Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Connection Type</span>
                <div className="flex items-center">
                  <Usb className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">USB Modem</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Port</span>
                <span className="text-sm text-gray-900 font-mono">
                  {import.meta.env.VITE_SMS_GATEWAY_PORT || '/dev/ttyUSB0'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Baud Rate</span>
                <span className="text-sm text-gray-900">115200</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Queue Length</span>
                <Badge variant="secondary">
                  {gatewayStatus?.queueLength || 0} messages
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">Last Checked</span>
                <span className="text-sm text-gray-900">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Radio className="mr-2 h-5 w-5" />
              Network Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Network Operator</span>
                <span className="text-sm text-gray-900">
                  {gatewayStatus?.simProvider || 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Signal Quality</span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={(gatewayStatus?.signalStrength || 0) / 31 * 100} 
                    className="w-16 h-2"
                  />
                  <span className="text-sm text-gray-900">
                    {Math.round((gatewayStatus?.signalStrength || 0) / 31 * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Registration Status</span>
                <Badge className={gatewayStatus?.connected ? "status-badge connected" : "status-badge disconnected"}>
                  {gatewayStatus?.connected ? 'Registered' : 'Not Registered'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">SMS Mode</span>
                <span className="text-sm text-gray-900">Text Mode</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">Rate Limit</span>
                <span className="text-sm text-gray-900">1 SMS/second</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Hardware Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Supported USB SMS Modems</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Huawei E3372</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 4G LTE USB dongle</li>
                    <li>• Supports SMS and voice</li>
                    <li>• Easy plug-and-play setup</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">ZTE MF79U</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 4G LTE USB modem</li>
                    <li>• High-speed SMS sending</li>
                    <li>• Reliable connection</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Setup Steps</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Insert SIM Card</p>
                    <p className="text-sm text-gray-600">Insert your Lyca SIM card with unlimited SMS plan into the USB modem</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Connect USB Modem</p>
                    <p className="text-sm text-gray-600">Plug the USB modem into your computer's USB port</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Configure Environment</p>
                    <p className="text-sm text-gray-600">Set SMS_GATEWAY_PORT and SIM_PIN environment variables if needed</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Test Connection</p>
                    <p className="text-sm text-gray-600">Use the "Check Status" button to verify the connection</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Important Notes</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ensure your SIM card has sufficient credit for SMS sending</li>
                    <li>• The USB modem should appear as a serial device (e.g., /dev/ttyUSB0 on Linux)</li>
                    <li>• Some modems may require PIN unlock - set the SIM_PIN environment variable</li>
                    <li>• For Windows users, check Device Manager for the correct COM port</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Gateway Not Connecting</h5>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Check USB connection and try a different port</li>
                <li>• Verify the correct port in environment variables</li>
                <li>• Ensure the SIM card is properly inserted</li>
                <li>• Check if the SIM PIN is required and set correctly</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Poor Signal Strength</h5>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Move the modem to a location with better cellular coverage</li>
                <li>• Use a USB extension cable to position the modem near a window</li>
                <li>• Consider using an external antenna if supported</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Messages Not Sending</h5>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Verify SIM card credit and SMS plan availability</li>
                <li>• Check for network registration issues</li>
                <li>• Ensure phone numbers are in correct international format</li>
                <li>• Review message queue for any stuck messages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
