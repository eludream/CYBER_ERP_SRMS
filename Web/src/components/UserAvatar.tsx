import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  profilePictureUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

const UserAvatar = ({ name, profilePictureUrl, className, fallbackClassName }: UserAvatarProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [profilePictureUrl]);

  return (
    <span className={cn("relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full", className)}>
      {profilePictureUrl && !failed ? (
        <img
          key={profilePictureUrl}
          src={profilePictureUrl}
          alt={`${name || "User"} profile`}
          className="aspect-square h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={cn("flex h-full w-full items-center justify-center bg-muted text-muted-foreground", fallbackClassName)}>
          <UserRound className="h-[55%] w-[55%]" aria-hidden="true" />
          <span className="sr-only">{name || "User"}</span>
        </span>
      )}
    </span>
  );
};

export default UserAvatar;
