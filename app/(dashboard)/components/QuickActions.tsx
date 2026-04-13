"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Send, BarChart3, Users } from "lucide-react";

import type { Variants } from "framer-motion";

interface QuickActionsProps {
  postsCount: number;
  connectedAccountsCount: number;
  fadeUp: Variants;
}

const actions = [
  {
    label: "All Posts",
    href: "/posts",
    icon: Send,
    sub: "{count} โพสต์ · ดูและจัดการทั้งหมด",
    gradient: "bg-gradient-to-br from-cyan-500 to-blue-500",
    shadow: "shadow-cyan-500/25",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    sub: "เช็กยอดผลลัพธ์แต่ละแพลตฟอร์ม",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/25",
  },
  {
    label: "Accounts",
    href: "/accounts/connect",
    icon: Users,
    sub: "{count} บัญชี · เพิ่มช่องทางใหม่",
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-500",
    shadow: "shadow-emerald-500/25",
  },
];

export function QuickActions({
  postsCount,
  connectedAccountsCount,
  fadeUp,
}: QuickActionsProps) {
  return (
    <motion.div variants={fadeUp} className="col-span-2 lg:col-span-4">
      <div className="flex items-stretch rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-100/80 dark:border-slate-800/80 p-1.5 gap-1">
        {actions.map((action) => {
          const Icon = action.icon;
          const subText = action.sub
            .replace("{count}", action.label === "All Posts" ? String(postsCount) : String(connectedAccountsCount));
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200 group"
            >
              <div
                className={`w-11 h-11 rounded-2xl ${action.gradient} flex items-center justify-center shadow-lg ${action.shadow} group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-center min-w-0">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  {action.label}
                </span>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight line-clamp-2">{subText}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
