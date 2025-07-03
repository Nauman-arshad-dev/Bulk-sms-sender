import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import ContactLists from "@/pages/contact-lists";
import ComposeMessage from "@/pages/compose-message";
import ScheduledMessages from "@/pages/scheduled-messages";
import DeliveryReports from "@/pages/delivery-reports";
import GdprCompliance from "@/pages/gdpr-compliance";
import SmsGatewaySetup from "@/pages/sms-gateway-setup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/contact-lists" component={ContactLists} />
            <Route path="/compose-message" component={ComposeMessage} />
            <Route path="/scheduled-messages" component={ScheduledMessages} />
            <Route path="/delivery-reports" component={DeliveryReports} />
            <Route path="/gdpr-compliance" component={GdprCompliance} />
            <Route path="/sms-gateway-setup" component={SmsGatewaySetup} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
