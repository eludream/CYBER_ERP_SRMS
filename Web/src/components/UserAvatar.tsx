import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  profilePictureUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

const UserAvatar = ({ name, profilePictureUrl, className, fallbackClassName }: UserAvatarProps) => (
  <Avatar className={cn("h-8 w-8", className)}>
    {profilePictureUrl ? <AvatarImage src={profilePictureUrl} alt={`${name || "User"} profile`} className="object-cover" /> : null}
    <AvatarFallback className={cn("bg-muted text-muted-foreground", fallbackClassName)}>
      <UserRound className="h-[55%] w-[55%]" aria-hidden="true" />
      <span className="sr-only">{name || "User"}</span>
    </AvatarFallback>
  </Avatar>
);

export default UserAvatar;
