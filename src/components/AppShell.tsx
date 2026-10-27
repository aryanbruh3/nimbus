"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CloudLogoIcon,
  DashboardIcon,
  FilesIcon,
  StarIcon,
  UserIcon,
  SearchIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
} from "./icons";
import { StorageMeter } from "./StorageMeter";

interface User {
  id: string;
  email: string;
  username: string;
  storageQuota: number;
  storageUsed: number;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/files", label: "All Files", icon: FilesIcon },
  { href: "/starred", label: "Starred", icon: StarIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close account menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  }, [router]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (trimmed) {
        router.push(`/files?q=${encodeURIComponent(trimmed)}`);
      } else {
        router.push("/files");
      }
      setSidebarOpen(false);
    },
    [searchQuery, router]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex">
        {/* Left Navigation Sidebar */}
        <aside
          className={`
            fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col
            transition-transform duration-200 ease-in-out
            lg:translate-x-0 lg:static lg:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Brand Wordmark & Logo */}
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group focus:outline-none"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <CloudLogoIcon size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-base leading-tight tracking-tight">
                  Nimbus
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Cloud Storage
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md"
              aria-label="Close sidebar"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-blue-600" : "text-slate-400"}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Compact Storage Indicator at bottom */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <StorageMeter
              usedBytes={user.storageUsed}
              quotaBytes={user.storageQuota}
              compact
            />
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Toolbar */}
          <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <MenuIcon size={20} />
              </button>

              {/* Global search input */}
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <SearchIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search stored files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </form>
            </div>

            {/* Account dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center uppercase border border-blue-200">
                  {user.username.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.username}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight truncate max-w-[130px]">
                    {user.email}
                  </span>
                </div>
                <ChevronDownIcon size={14} className="text-slate-400" />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <UserIcon size={15} className="text-slate-400" />
                    <span>Account Settings</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOutIcon size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
