import { StatsCards } from "@/components/stats-cards";
import { QuickCompose } from "@/components/quick-compose";
import { ContactManagement } from "@/components/contact-management";
import { DeliveryStatus } from "@/components/delivery-status";
import { GdprDashboard } from "@/components/gdpr-dashboard";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your SMS campaigns and contacts</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <StatsCards />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <QuickCompose />
        <ContactManagement />
      </div>

      {/* Delivery Status */}
      <div className="mb-8">
        <DeliveryStatus />
      </div>

      {/* GDPR Compliance */}
      <div className="mb-8">
        <GdprDashboard />
      </div>
    </div>
  );
}
