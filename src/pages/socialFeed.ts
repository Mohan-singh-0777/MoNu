import { supabase } from "@/integrations/supabase/client";

export async function getGlobalFeedConversation() {
const { data: existing } = await supabase
.from("conversations")
.select("*")
.eq("type", "group")
.eq("name", "**GLOBAL_SOCIAL_FEED**")
.maybeSingle();

if (existing) return existing.id;

const { data, error } = await supabase
.from("conversations")
.insert({
type: "group",
name: "**GLOBAL_SOCIAL_FEED**",
})
.select()
.single();

if (error) throw error;
return data.id;
}
