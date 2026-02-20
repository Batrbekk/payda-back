"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Building2, Receipt, Image, Shield, UserCheck, LogOut, Wrench, ShoppingCart, Droplets, HandCoins, Globe } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/partners/service-centers", label: "Сервисные центры", icon: Building2 },
  { href: "/admin/partners/auto-shops", label: "Автомагазины", icon: ShoppingCart },
  { href: "/admin/partners/car-washes", label: "Автомойки", icon: Droplets },
  { href: "/admin/services", label: "Каталог услуг", icon: Wrench },
  { href: "/admin/visits", label: "Визиты", icon: Receipt },
  { href: "/admin/settlements", label: "Взаиморасчёт", icon: HandCoins },
  { href: "/admin/banners", label: "Баннеры", icon: Image },
  { href: "/admin/warranties", label: "Гарантии", icon: Shield },
  { href: "/admin/warranty-managers", label: "Менеджеры гарантий", icon: UserCheck },
  { href: "/admin/landing", label: "Лендинг", icon: Globe },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Payda Admin</h1>
          <p className="text-sm text-gray-500">Панель управления</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-yellow-50 text-yellow-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full"
          >
            <LogOut className="h-5 w-5" />
            Выйти
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
