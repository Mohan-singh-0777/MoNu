import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Profile } from "@/types/chat";
import { UserAvatar } from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { findOrCreateDirectConversation, createGroupConversation } from "@/hooks/useConversations";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export const NewChatDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState("");
  const [tab, setTab] = useState<"direct" | "group">("direct");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let active = true;

    const t = setTimeout(async () => {
      const q = query.trim();
      const builder = supabase.from("profiles").select("*").neq("id", user.id).limit(20);
      const filtered = q
        ? builder.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        : builder.order("created_at", { ascending: false });

      const { data } = await filtered;
      if (active) setResults((data ?? []) as Profile[]);
    }, 200);

    return () => {
      active = false;
      clearTimeout(t);
    };

  }, [query, open, user]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected([]);
      setGroupName("");
      setTab("direct");
    }
  }, [open]);

  const toggle = (p: Profile) => {
    setSelected((prev) =>
      prev.some((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]
    );
  };

  const startDirect = async (p: Profile) => {
    if (!user) return;
    setBusy(true);
    try {
      const id = await findOrCreateDirectConversation(p.id);
      onOpenChange(false);
      navigate(`/chat/${id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const startGroup = async () => {
    if (!user) return;
    if (selected.length < 2) return toast.error("Pick at least 2 people");
    if (!groupName.trim()) return toast.error("Give the group a name");

    setBusy(true);
    try {
      const id = await createGroupConversation(groupName.trim(), selected.map((s) => s.id));
      onOpenChange(false);
      navigate(`/chat/${id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }

  };

  return (<Dialog open={open} onOpenChange={onOpenChange}> <DialogContent className="max-w-md rounded-3xl border-0 bg-white p-0 shadow-2xl"> <DialogHeader className="px-6 pt-6"> <DialogTitle className="text-xl font-bold text-gray-800">New Chat</DialogTitle> </DialogHeader>

    <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="px-6">
      <TabsList className="grid w-full grid-cols-2 rounded-full bg-gray-100 p-1">
        <TabsTrigger value="direct" className="rounded-full">Direct</TabsTrigger>
        <TabsTrigger value="group" className="rounded-full">
          <Users className="mr-1 h-3.5 w-3.5" /> Group
        </TabsTrigger>
      </TabsList>

      <div className="mt-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people..."
          className="rounded-full border-0 bg-gray-100"
        />
      </div>

      {tab === "group" && (
        <div className="mt-3">
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="rounded-full border-0 bg-gray-100"
          />
        </div>
      )}

      <TabsContent value="direct" className="mt-4">
        <ScrollArea className="h-72">
          <ul className="space-y-1">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  disabled={busy}
                  onClick={() => startDirect(p)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-pink-50"
                >
                  <UserAvatar profile={p} size="md" showStatus />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-800">
                      {p.display_name || p.username}
                    </div>
                    <div className="truncate text-xs text-gray-400">@{p.username}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="group" className="mt-4">
        <ScrollArea className="h-60">
          <ul className="space-y-1">
            {results.map((p) => {
              const isSel = selected.some((s) => s.id === p.id);

              return (
                <li key={p.id}>
                  <button
                    onClick={() => toggle(p)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left",
                      isSel ? "bg-pink-50" : "hover:bg-pink-50"
                    )}
                  >
                    <UserAvatar profile={p} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-800">
                        {p.display_name || p.username}
                      </div>
                      <div className="truncate text-xs text-gray-400">@{p.username}</div>
                    </div>

                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        isSel
                          ? "border-pink-500 bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                          : "border-gray-300"
                      )}
                    >
                      {isSel && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>

        <div className="mt-4 pb-6">
          <Button
            className="w-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white"
            onClick={startGroup}
            disabled={busy || selected.length < 2 || !groupName.trim()}
          >
            Create Group
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  </DialogContent>
  </Dialog>

  );
};
