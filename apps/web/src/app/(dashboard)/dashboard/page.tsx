"use client";

import { useAuthStore } from "@/store/auth-store";
import { Users, FileText, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const cards = [
    {
      title: "Patients",
      description: "View and manage your patient list",
      icon: Users,
      href: "/patients",
      color: "bg-blue-50 text-blue-700",
      iconBg: "bg-blue-100",
    },
    {
      title: "Templates",
      description: "Browse IQMD protocol templates",
      icon: FileText,
      href: "/templates",
      color: "bg-purple-50 text-purple-700",
      iconBg: "bg-purple-100",
    },
    {
      title: "Recent Protocols",
      description: "Continue working on draft protocols",
      icon: Clock,
      href: "/patients",
      color: "bg-teal-50 text-teal-700",
      iconBg: "bg-teal-100",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Good morning, Dr. {user?.last_name}
        </h1>
        <p className="text-slate-500 mt-1">
          IQMD Functional Medicine Protocol Editor
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map(({ title, description, icon: Icon, href, color, iconBg }) => (
          <Link key={title} href={href}>
            <div className={`rounded-xl p-6 border border-slate-100 bg-white hover:shadow-md transition-shadow cursor-pointer`}>
              <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color.split(" ")[1]}`} />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}