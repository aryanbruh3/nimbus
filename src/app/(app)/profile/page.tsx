"use client";

import { useEffect, useState, useTransition } from "react";
import { formatBytes } from "@/lib/constants";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { StorageMeter } from "@/components/StorageMeter";
import { EmptyState } from "@/components/EmptyState";
import {
  UserIcon,
  HardDriveIcon,
  FilesIcon,
  SpinnerIcon,
} from "@/components/icons";

interface ProfileData {
  user: {
    id: string;
    email: string;
    username: string;
    storageQuota: number;
    storageUsed: number;
  };
  typeBreakdown: { type: string; count: number; size: number }[];
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ])
      .then(([userData, dashData]) => {
        if (userData?.user) {
          startTransition(() => {
            setData({
              user: userData.user,
              typeBreakdown: dashData?.typeBreakdown || [],
            });
          });
        }
      })
      .catch((err) => console.error("Error loading profile:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-400 gap-3">
        <SpinnerIcon size={28} className="text-blue-600" />
        <span className="text-sm font-medium text-slate-500">
          Loading profile details...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Could not load profile"
        description="Unable to retrieve your account information. Please try refreshing."
        action={{
          label: "Reload",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const { user, typeBreakdown } = data;
  const totalFiles = typeBreakdown.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account & Storage
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your Nimbus profile credentials and quota allocations
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center uppercase border border-blue-200 shrink-0">
            {user.username.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {user.username}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-6 text-center sm:text-left">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Files
            </span>
            <div className="text-xl font-bold text-slate-900">{totalFiles}</div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Space Used
            </span>
            <div className="text-xl font-bold text-slate-900">
              {formatBytes(user.storageUsed)}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Quota
            </span>
            <div className="text-xl font-bold text-slate-900">
              {formatBytes(user.storageQuota)}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Meter Card */}
      <StorageMeter usedBytes={user.storageUsed} quotaBytes={user.storageQuota} />

      {/* Category Breakdown */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-4">
          Detailed Storage by File Type
        </h3>

        {typeBreakdown.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {typeBreakdown
              .sort((a, b) => b.size - a.size)
              .map((item) => (
                <div
                  key={item.type}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <FileTypeIcon type={item.type} size="md" />
                    <div>
                      <span className="text-sm font-medium text-slate-900 capitalize">
                        {item.type}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {item.count} file{item.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-700">
                    {formatBytes(item.size)}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">
            No files in storage yet.
          </p>
        )}
      </div>

      {/* Security & System Info */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-3">
          Session Security
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your session is securely authenticated using encrypted HTTP-only session tokens.
          Every file download and mutation strictly validates your ownership against your account identifier.
        </p>
      </div>
    </div>
  );
}
