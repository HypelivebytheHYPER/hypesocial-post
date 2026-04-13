"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Download,
  UserPlus,
  Shield,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui/dashboard-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Skeleton,
  CardSkeleton,
  StatsGridSkeleton,
} from "@/components/ui/skeleton";

// Types
interface Person {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "inactive" | "pending";
  avatar?: string;
  department: string;
  location: string;
  joinDate: string;
  lastActive: string;
}

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function PeoplePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with actual API call to fetch team members
  // const { data: people, isLoading } = usePeople();
  const people: Person[] = []; // Empty until API is connected

  // Filter people
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || person.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || person.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [people, searchQuery, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: people.length,
      active: people.filter((p) => p.status === "active").length,
      pending: people.filter((p) => p.status === "pending").length,
      admins: people.filter((p) => p.role === "admin").length,
    };
  }, [people]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return Shield;
      case "editor":
        return User;
      default:
        return User;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active:
        "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      inactive:
        "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
      pending:
        "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    };
    return variants[status] || variants.inactive;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <StatsGridSkeleton count={4} />
        <div className="h-12 w-full max-w-md">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            People
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage team members and their access
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Person
        </Button>
      </div>

      {/* Stats Cards */}
      <DashboardCardGrid columns={4}>
        <DashboardCard
          title="Total People"
          description="Team members"
          icon={User}
          iconVariant="default"
          value={stats.total}
        />
        <DashboardCard
          title="Active"
          description="Currently active"
          icon={CheckCircle2}
          iconVariant="soft"
          value={stats.active}
        />
        <DashboardCard
          title="Pending"
          description="Awaiting approval"
          icon={Clock}
          iconVariant="minimal"
          value={stats.pending}
          variant="soft"
        />
        <DashboardCard
          title="Admins"
          description="Full access"
          icon={Shield}
          iconVariant="default"
          value={stats.admins}
        />
      </DashboardCardGrid>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button variant="outline" size="icon" className="h-11 w-11">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* People List */}
      {filteredPeople.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Add your first team member to get started"
          action={{ label: "Add Person", onClick: () => console.log("Add person") }}
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filteredPeople.map((person) => {
            const RoleIcon = getRoleIcon(person.role);
            return (
              <motion.div
                key={person.id}
                variants={item}
                className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                      {person.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {person.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize",
                          getStatusBadge(person.status)
                        )}
                      >
                        {person.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {person.email}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <RoleIcon className="w-3 h-3" />
                        <span className="capitalize">{person.role}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {person.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {person.joinDate}
                      </span>
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-400">Last active</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {person.lastActive}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit role</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Remove access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
