"use client";

import Link from "next/link";
import {
  Bell,
  Shield,
  User,
  Moon,
  Globe,
  Mail,
  Trash2,
  ChevronRight,
  CreditCard,
  Key,
  Webhook,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const settingsSections = [
  {
    title: "Profile",
    description: "Account information",
    icon: User,
    href: null,
  },
  {
    title: "Notifications",
    description: "Email and push settings",
    icon: Bell,
    href: null,
  },
  {
    title: "Security",
    description: "Password and 2FA",
    icon: Shield,
    href: null,
  },
  {
    title: "Billing",
    description: "Subscription and payments",
    icon: CreditCard,
    href: null,
  },
  {
    title: "Webhooks",
    description: "API integrations",
    icon: Webhook,
    href: "/webhooks",
  },
  {
    title: "API Keys",
    description: "Developer settings",
    icon: Key,
    href: null,
  },
  {
    title: "Diagnostics",
    description: "Check API connections",
    icon: Activity,
    href: "/diagnostics",
  },
  {
    title: "Language",
    description: "Interface language",
    icon: Globe,
    href: null,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="greeting-title">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your preferences</p>
      </div>

      <div className="divider-soft" />

      {/* Profile Card */}
      <section className="card-premium p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-slate-800 text-white text-lg font-semibold">
              AR
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-slate-800 font-semibold text-lg">Alif Reza</h2>
            <p className="text-slate-400 text-sm">alif@hypelive.studio</p>
          </div>
          <Badge className="badge-soft success">Pro Plan</Badge>
        </div>
      </section>

      {/* Settings Grid */}
      <section>
        <h2 className="section-title mb-4">General</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            if (section.href) {
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="card-premium p-4 text-left hover:scale-[1.02] transition-transform block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-700 font-medium text-sm">
                        {section.title}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              );
            }
            return (
              <button
                key={section.title}
                className="card-premium p-4 text-left hover:scale-[1.02] transition-transform w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-slate-700 font-medium text-sm">
                      {section.title}
                    </h3>
                    <p className="text-slate-400 text-xs">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Two Column - Preferences */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Email Preferences */}
        <section className="card-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <h2 className="text-slate-800 font-semibold">
                Email Preferences
              </h2>
              <p className="text-slate-400 text-xs">
                Manage your notifications
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              "Weekly digest",
              "Post notifications",
              "Security alerts",
              "Marketing updates",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer"
              >
                <span className="text-slate-600 text-sm">{item}</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section className="card-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Moon className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <h2 className="text-slate-800 font-semibold">Appearance</h2>
              <p className="text-slate-400 text-xs">Customize your interface</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 text-sm font-medium">
                  Light
                </span>
                <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 opacity-50">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Dark</span>
                <div className="w-4 h-4 rounded-full border-2 border-slate-400" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 opacity-50">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">System</span>
                <div className="w-4 h-4 rounded-full border-2 border-slate-400" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <section>
        <h2 className="text-red-500 text-xs font-semibold uppercase tracking-wider mb-4">
          Danger Zone
        </h2>
        <div className="card-premium p-5 border-red-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-700 font-medium">Delete Account</h3>
                <p className="text-slate-400 text-xs">
                  Permanently remove your data
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-500 hover:bg-red-50"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
