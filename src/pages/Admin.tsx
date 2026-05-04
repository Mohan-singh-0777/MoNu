import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, Users, MessageSquare, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Profile, Conversation, Message } from "@/types/chat";
import { format } from "date-fns";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [recentMsgs, setRecentMsgs] = useState<(Message & { sender?: Profile })[]>([]);
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState({ users: 0, convs: 0, msgs: 0, online: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const [{ data: ps }, { data: cs }, { data: ms }, { count: msgsCount }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("conversations").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("messages").select("*", { count: "exact", head: true }),
      ]);
      const profiles = (ps ?? []) as Profile[];
      setUsers(profiles);
      setConvs((cs ?? []) as Conversation[]);
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      setRecentMsgs(((ms ?? []) as Message[]).map((m) => ({ ...m, sender: profileMap.get(m.sender_id) })));
      setStats({
        users: profiles.length,
        convs: cs?.length ?? 0,
        msgs: msgsCount ?? 0,
        online: profiles.filter((p) => p.is_online).length,
      });
    };
    load();
  }, [isAdmin]);

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRecentMsgs((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message deleted");
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation and all its messages?")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setConvs((prev) => prev.filter((c) => c.id !== id));
    toast.success("Conversation deleted");
  };

  if (authLoading) return null;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Admin access required</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account doesn't have admin privileges. To grant yourself admin, run this in the database:
        </p>
        <code className="rounded-md bg-secondary px-3 py-2 text-xs">
          INSERT INTO user_roles (user_id, role) VALUES ('{user?.id}', 'admin');
        </code>
        <Button variant="outline" onClick={() => navigate("/")}>Back to chat</Button>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    (u.display_name?.toLowerCase().includes(query.toLowerCase()) ?? false),
  );

  return (
    <div className="mx-auto min-h-screen max-w-5xl">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-lg font-semibold">Admin dashboard</h1>
      </header>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Users" value={stats.users} />
          <StatCard label="Online now" value={stats.online} />
          <StatCard label="Conversations" value={stats.convs} />
          <StatCard label="Messages" value={stats.msgs} />
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users"><Users className="mr-1.5 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="conversations"><MessageSquare className="mr-1.5 h-4 w-4" />Conversations</TabsTrigger>
            <TabsTrigger value="messages">Recent messages</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" className="mb-3 max-w-sm" />
            <Card className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3">
                  <UserAvatar profile={u} size="md" showStatus />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{u.display_name || u.username}</div>
                    <div className="truncate text-xs text-muted-foreground">@{u.username} · joined {format(new Date(u.last_seen), "MMM d, yyyy")}</div>
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="conversations" className="mt-4">
            <Card className="divide-y divide-border">
              {convs.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.type === "group" ? c.name || "Group" : "Direct conversation"}</div>
                    <div className="text-xs text-muted-foreground">{c.type} · {format(new Date(c.created_at), "MMM d, yyyy")}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteConversation(c.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <Card className="divide-y divide-border">
              {recentMsgs.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3">
                  <UserAvatar profile={m.sender ?? null} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{m.sender?.display_name || m.sender?.username || "?"}</span>
                      <span>·</span>
                      <span>{format(new Date(m.created_at), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm">{m.content || `[${m.message_type}]`}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteMessage(m.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 text-2xl font-semibold">{value}</div>
  </Card>
);

export default Admin;
