"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VirtualAccountsList } from "@/components/virtual-accounts-list";
import { useSocialAccounts, useDisconnectSocialAccount } from "@/lib/hooks";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function AccountsPage() {
  const {
    data: accountsData,
    isLoading,
    error,
    refetch,
  } = useSocialAccounts(100); // Load up to 100 accounts (API limit)

  const disconnect = useDisconnectSocialAccount();

  const accounts = accountsData?.data ?? [];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header - Minimal */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Social Accounts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your connected social media accounts
            </p>
          </div>
          <Button asChild size="sm" className="h-8 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg">
            <Link href="/accounts/connect">
              <Plus className="mr-1.5 h-4 w-4" />
              Connect Account
            </Link>
          </Button>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Virtualized Accounts List */}
        <VirtualAccountsList
          accounts={accounts}
          isLoading={isLoading}
          onDisconnect={(id) => disconnect.mutate(id)}
          isDisconnecting={disconnect.isPending}
        />
      </div>
    </div>
  );
}
