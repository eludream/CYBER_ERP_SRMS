import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useERP, Notification } from "@/contexts/ERPContext";
import { Bell, Check, CheckCheck, X, ExternalLink, AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const typeColors = {
  info: "text-info bg-info/10",
  warning: "text-warning bg-warning/10",
  error: "text-destructive bg-destructive/10",
  success: "text-success bg-success/10",
};

const moduleLabels: Record<string, string> = {
  finance: "Finance",
  sales: "Sales",
  procurement: "Procurement",
  inventory: "Inventory",
  production: "Production",
  hr: "HR",
  quality: "Quality",
};

const NotificationPanel = () => {
  const { notifications, unreadCount, markAsRead, markAllRead, clearNotification } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const filtered = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  const handleAction = (n: Notification) => {
    markAsRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-ring"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[520px] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Filter */}
            <div className="px-4 py-2 border-b border-border flex gap-2">
              {(["all", "unread"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? "All" : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[380px]">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No {filter === "unread" ? "unread " : ""}notifications
                </div>
              ) : (
                filtered.map(n => {
                  const TypeIcon = typeIcons[n.type];
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                        !n.read && "bg-primary/[0.02]"
                      )}
                      onClick={() => handleAction(n)}
                    >
                      <div className="flex gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", typeColors[n.type])}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn("text-sm leading-tight", !n.read ? "font-semibold" : "font-medium")}>
                                {n.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                              className="shrink-0 p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                              {moduleLabels[n.module] || n.module}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                            </span>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </div>
                          {n.actionLabel && (
                            <button className="mt-1.5 text-[11px] text-primary font-medium flex items-center gap-1 hover:underline">
                              {n.actionLabel} <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
