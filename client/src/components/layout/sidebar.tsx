import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Edit,
  Clock,
  BarChart3,
  Shield,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contact Lists", href: "/contact-lists", icon: Users },
  { name: "Compose Message", href: "/compose-message", icon: Edit },
  { name: "Scheduled Messages", href: "/scheduled-messages", icon: Clock },
  { name: "Delivery Reports", href: "/delivery-reports", icon: BarChart3 },
];

const settingsNavigation = [
  { name: "GDPR Compliance", href: "/gdpr-compliance", icon: Shield },
  { name: "SMS Gateway Setup", href: "/sms-gateway-setup", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
      <nav className="mt-8">
        <div className="px-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main
          </h2>
        </div>
        
        <ul className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-blue-50 text-primary border-r-2 border-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-6 mt-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Settings
          </h2>
        </div>
        
        <ul className="space-y-1 px-3">
          {settingsNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-blue-50 text-primary border-r-2 border-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
