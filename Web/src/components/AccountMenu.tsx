import { useState } from "react";
import { ChevronDown, LogOut, UserRoundPen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import UserAccountDialog from "@/components/UserAccountDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const toSentenceCase = (value?: string) => {
  const normalized = value?.trim().toLocaleLowerCase() ?? "";
  return normalized ? normalized.charAt(0).toLocaleUpperCase() + normalized.slice(1) : "";
};

const AccountMenu = () => {
  const { user, logout } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const fullName = toSentenceCase(user?.name);
  const accountIdentity = `${user?.userName ?? ""} (${user?.email ?? ""})`.toLocaleLowerCase();

  const handleSignOut = async () => {
    await logout();
    window.location.replace("/");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted transition-colors" aria-label="Open account menu">
            <UserAvatar name={fullName} profilePictureUrl={user?.profilePictureUrl} className="h-7 w-7 ring-2 ring-primary/20" />
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold leading-tight text-foreground">{fullName}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{accountIdentity}</p>
            </div>
            <ChevronDown className="hidden h-3 w-3 text-muted-foreground xl:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">{fullName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{accountIdentity}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditProfileOpen(true)} className="gap-2.5 text-xs">
            <UserRoundPen className="h-3.5 w-3.5 text-muted-foreground" /> Edit Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="gap-2.5 text-xs text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <UserAccountDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </>
  );
};

export default AccountMenu;
