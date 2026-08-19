import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useERP } from "@/contexts/ERPContext";
import { modules, visibleModules } from "@/config/modules";
import {
  Bell, CheckCircle, Clock, AlertTriangle, ChevronRight,
  CalendarDays, CreditCard, FileText, ClipboardCheck, User,
  Building2, LayoutGrid, TrendingUp, Activity,
  BookOpen, ArrowRight, CheckCircle2, XCircle, CircleDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import AccountMenu from "@/components/AccountMenu";
import { moduleService } from "@/services/api/moduleService";

const priorityColor: Record<string, string> = {
  Critical: "text-destructive bg-destructive/10",
  High: "text-orange-500 bg-orange-500/10",
  Medium: "text-amber-500 bg-amber-500/10",
  Low: "text-muted-foreground bg-muted",
};

const typeLabel: Record<string, string> = {
  journal_entry: "Journal Entry",
  purchase_requisition: "Purchase Requisition",
  leave_request: "Leave Request",
  expense_claim: "Expense Claim",
  sales_order: "Sales Order",
  ncr_disposition: "NCR Disposition",
};

const Home = () => {
  const { user, selectModule } = useAuth();
  const [subSystemOrder, setSubSystemOrder] = useState<Map<string, number>>(() => new Map());
  useEffect(() => {
    let alive = true;
    void moduleService.list().then(response => {
      if (alive) setSubSystemOrder(new Map(response.data.map(subSystem => [subSystem.code, subSystem.displayOrder])));
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const orderedVisibleModules = useMemo(() => [...visibleModules].sort((left, right) => {
    const leftOrder = subSystemOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = subSystemOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder || left.title.localeCompare(right.title);
  }), [subSystemOrder]);
  const {
    notifications, unreadCount, markAsRead,
    approvals, pendingApprovalCount, approveRequest, rejectRequest,
    activityLog,
  } = useERP();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const pendingApprovals = approvals.filter(a => a.status === "Pending");
  const unreadNotifications = notifications.filter(n => !n.read);
  const recentActivity = activityLog.slice(0, 8);

  const handleModuleSelect = (moduleId: string) => {
    selectModule(moduleId as any);
    const mod = modules.find(m => m.id === moduleId);
    if (mod && mod.subModules.length > 0) {
      navigate(mod.subModules[0].path);
    }
  };

  const handleNotificationAction = (n: typeof notifications[0]) => {
    markAsRead(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  // Mock tasks for the logged-in user
  const myTasks = [
    { id: "t1", title: "Review Q1 Financial Statements", module: "finance", priority: "High", dueDate: "2026-03-10", status: "In Progress" },
    { id: "t2", title: "Complete AWS Certification Training", module: "hr", priority: "Medium", dueDate: "2026-03-15", status: "Not Started" },
    { id: "t3", title: "Approve vendor contract renewal — LogiTech Parts", module: "procurement", priority: "High", dueDate: "2026-03-12", status: "In Progress" },
    { id: "t4", title: "Submit monthly expense report", module: "hr", priority: "Low", dueDate: "2026-03-20", status: "Not Started" },
    { id: "t5", title: "Review NCR-201 disposition report", module: "quality", priority: "Critical", dueDate: "2026-03-09", status: "In Progress" },
  ];

  const quickStats = [
    { label: "Pending Approvals", value: pendingApprovalCount, icon: ClipboardCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Unread Alerts", value: unreadCount, icon: Bell, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "My Tasks", value: myTasks.length, icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active Modules", value: visibleModules.length, icon: LayoutGrid, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  // Payslip data
  const payslips = [
    { period: "March 2026", gross: "$10,050", net: "$7,691", date: "2026-03-25" },
    { period: "February 2026", gross: "$9,800", net: "$7,502", date: "2026-02-25" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-[15px] text-foreground">
              Cyber<span className="text-primary">ERP</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/subsystems")}
              className="h-8 text-xs gap-1.5"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Modules
            </Button>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome & Profile Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <UserAvatar name={user?.name} profilePictureUrl={user?.profilePictureUrl} className="h-14 w-14 rounded-2xl border-2 border-primary/20" fallbackClassName="rounded-2xl text-lg" />
            <div>
              <p className="text-sm text-muted-foreground">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
              <h1 className="text-2xl font-display font-bold text-foreground">{user?.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.role} · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("/self-service")}>
              <User className="w-3.5 h-3.5 mr-1.5" /> My Profile
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("/hr/expenses")}>
              <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Expense Claim
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("/hr/leave")}>
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Request Leave
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals {pendingApprovalCount > 0 && <span className="ml-1.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold inline-flex items-center justify-center px-1">{pendingApprovalCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Alerts {unreadCount > 0 && <span className="ml-1.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold inline-flex items-center justify-center px-1">{unreadCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Approvals Preview */}
              <div className="rounded-xl border border-border bg-card">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-amber-500" /> Pending Approvals
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("approvals")}>
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {pendingApprovals.slice(0, 3).map(a => (
                    <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${priorityColor[a.priority]}`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{typeLabel[a.type] || a.type} · {a.requestedBy}</p>
                      </div>
                      {a.amount && <span className="text-sm font-semibold text-foreground">${a.amount.toLocaleString()}</span>}
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={() => approveRequest(a.id)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => rejectRequest(a.id)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">No pending approvals</div>
                  )}
                </div>
              </div>

              {/* Unread Notifications Preview */}
              <div className="rounded-xl border border-border bg-card">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-destructive" /> Recent Alerts
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("notifications")}>
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {unreadNotifications.slice(0, 4).map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationAction(n)}
                      className="w-full px-5 py-3 flex items-start gap-3 text-left hover:bg-secondary/30 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === "error" ? "bg-destructive" : n.type === "warning" ? "bg-amber-500" : "bg-primary"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      </div>
                    </button>
                  ))}
                  {unreadNotifications.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">All caught up!</div>
                  )}
                </div>
              </div>
            </div>

            {/* My Tasks + Recent Activity side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks */}
              <div className="rounded-xl border border-border bg-card">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" /> My Tasks
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("tasks")}>
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {myTasks.slice(0, 3).map(t => (
                    <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                      <CircleDot className={`w-4 h-4 shrink-0 ${t.status === "In Progress" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">Due: {t.dueDate} · {t.module}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColor[t.priority]}`}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Log */}
              <div className="rounded-xl border border-border bg-card">
                <div className="px-5 py-3.5 border-b border-border">
                  <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" /> Recent Activity
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {recentActivity.slice(0, 4).map(a => (
                    <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm"><span className="font-medium">{a.user}</span> <span className="text-muted-foreground">{a.action.toLowerCase()}</span></p>
                        <p className="text-xs text-muted-foreground truncate">{a.details}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Access Modules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-sm text-foreground">Quick Access</h3>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/subsystems")}>
                  All Sub Systems <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
                {orderedVisibleModules.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => handleModuleSelect(mod.id)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <mod.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight">{mod.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Request</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Requested By</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map(a => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{typeLabel[a.type] || a.type}</td>
                      <td className="px-4 py-3 text-sm">{a.requestedBy}</td>
                      <td className="px-4 py-3 text-sm font-medium">{a.amount ? `$${a.amount.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${priorityColor[a.priority]}`}>{a.priority}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          a.status === "Approved" ? "text-emerald-500 bg-emerald-500/10" :
                          a.status === "Rejected" ? "text-destructive bg-destructive/10" :
                          "text-amber-500 bg-amber-500/10"
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {a.status === "Pending" ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-500 hover:bg-emerald-500/10" onClick={() => approveRequest(a.id)}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => rejectRequest(a.id)}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationAction(n)}
                  className={`w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-secondary/30 transition-colors ${!n.read ? "bg-primary/[0.02]" : ""}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    n.type === "error" ? "bg-destructive" : n.type === "warning" ? "bg-amber-500" : n.type === "success" ? "bg-emerald-500" : "bg-primary"
                  } ${n.read ? "opacity-30" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                      {!n.read && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">NEW</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{n.module}</span>
                      {n.actionLabel && (
                        <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                          {n.actionLabel} <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myTasks.map(t => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{t.title}</td>
                      <td className="px-4 py-3"><span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">{t.module}</span></td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${priorityColor[t.priority]}`}>{t.priority}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{t.dueDate}</td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${t.status === "In Progress" ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted"}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Payslips Tab */}
          <TabsContent value="payslips">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Gross</th>
                      <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Net</th>
                      <th className="px-4 py-3 text-left text-xs font-display font-semibold text-muted-foreground uppercase">Pay Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(p => (
                      <tr key={p.period} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{p.period}</td>
                        <td className="px-4 py-3 text-sm">{p.gross}</td>
                        <td className="px-4 py-3 text-sm font-medium text-primary">{p.net}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-display font-semibold text-sm">Quick Info</h3>
                {[
                  ["Leave Balance", "12 days"],
                  ["Next Payslip", "Mar 25, 2026"],
                  ["Tax ID", "TIN-98765432"],
                  ["Bank", "****4567 (GTBank)"],
                  ["Department", "Engineering"],
                  ["Position", "Senior Developer"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Home;
