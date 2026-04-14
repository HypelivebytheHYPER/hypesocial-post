"use client";

import { motion } from "framer-motion";
import {
  DashboardCard,
  DashboardCardGrid,
  PostsCard,
  EngagementCard,
  ViewsCard,
  AccountsCard,
  ScheduledCard,
  TrendingCard,
} from "@/components/ui/dashboard-card";
import { FileText } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardExamplePage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Premium Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Blue pastel gradient theme
        </p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Pre-built Cards
        </h2>
        <DashboardCardGrid columns={4}>
          <motion.div variants={item}><PostsCard count={1234} /></motion.div>
          <motion.div variants={item}><EngagementCard likes={856} comments={234} /></motion.div>
          <motion.div variants={item}><ViewsCard views={45600} /></motion.div>
          <motion.div variants={item}><AccountsCard count={6} /></motion.div>
        </DashboardCardGrid>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Card Variants
        </h2>
        <DashboardCardGrid columns={3}>
          <motion.div variants={item}><ScheduledCard count={12} /></motion.div>
          <motion.div variants={item}><TrendingCard /></motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Custom Card"
              description="Fully customizable"
              icon={FileText}
              iconVariant="minimal"
              value="Custom"
              footer="Using design tokens"
              action={{ label: "Learn more", onClick: () => {} }}
            />
          </motion.div>
        </DashboardCardGrid>
      </motion.div>
    </div>
  );
}
