import { Profile } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  profile: Pick<Profile, "avatar_url" | "display_name" | "username" | "is_online"> | null;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

const dotSize = {
  sm: "h-2.5 w-2.5 ring-2",
  md: "h-3 w-3 ring-2",
  lg: "h-3.5 w-3.5 ring-2",
  xl: "h-4 w-4 ring-[3px]",
};

export const UserAvatar = ({ profile, size = "md", showStatus, className }: Props) => {
  const name = profile?.display_name || profile?.username || "?";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={cn(sizeMap[size], "ring-2 ring-white shadow-md")}>
        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />} <AvatarFallback className="bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white font-semibold">
          {initials} </AvatarFallback> </Avatar>

      {showStatus && profile?.is_online && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-green-500 ring-2 ring-white shadow",
            dotSize[size]
          )}
        />
      )}
    </div>

  );
};
