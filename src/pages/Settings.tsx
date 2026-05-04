import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Profile } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  display_name: z.string().trim().min(1).max(50),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
});

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ display_name: displayName, bio });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, bio: bio || null }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const onAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
    setProfile((p) => p ? { ...p, avatar_url: pub.publicUrl } : p);
    setUploading(false);
    toast.success("Avatar updated");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <UserAvatar profile={profile} size="xl" />
          <div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatar(f); }} />
              <span className="text-sm font-medium text-primary hover:underline">{uploading ? "Uploading..." : "Change photo"}</span>
            </label>
            <p className="text-xs text-muted-foreground">@{profile?.username}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} />
          <p className="text-right text-xs text-muted-foreground">{bio.length}/280</p>
        </div>

        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
      </div>
    </div>
  );
};

export default Settings;
