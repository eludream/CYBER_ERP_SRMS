import { useLayoutEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  profilePictureUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

const UserAvatar = ({ name, profilePictureUrl, className, fallbackClassName }: UserAvatarProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const showImage = Boolean(profilePictureUrl) && loadedUrl === profilePictureUrl;

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!profilePictureUrl || !image?.complete) return;
    setLoadedUrl(image.naturalWidth > 0 ? profilePictureUrl : null);
  }, [profilePictureUrl]);

  return (
    <span className={cn("relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full", className)}>
      {profilePictureUrl ? (
        <img
          key={profilePictureUrl}
          ref={imageRef}
          src={profilePictureUrl}
          alt={`${name || "User"} profile`}
          className="aspect-square h-full w-full object-cover"
          onLoad={() => setLoadedUrl(profilePictureUrl)}
          onError={() => setLoadedUrl(null)}
        />
      ) : null}
      {!showImage ? (
        <span className={cn("absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground", fallbackClassName)}>
          <UserRound className="h-[55%] w-[55%]" aria-hidden="true" />
          <span className="sr-only">{name || "User"}</span>
        </span>
      ) : null}
    </span>
  );
};

export default UserAvatar;
