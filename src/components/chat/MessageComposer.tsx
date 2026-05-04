import { useRef, useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Smile, Image as ImageIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const EMOJIS = ["😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😎", "🤔", "🙃", "😉", "😘", "😢", "😭", "😡", "👍", "👎", "🙏", "🔥", "💯", "🎉", "❤️", "💔", "✨", "👀", "💪", "🙌", "✅", "❌", "⚡", "🌟", "🎂"];

type Props = {
  onSend: (content: string, attachment?: { url: string; name: string; type: "image" | "file" }) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
};

export const MessageComposer = ({ onSend, onTyping, disabled }: Props) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setText("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const upload = async (file: File, kind: "image" | "file") => {
    if (!user) return;
    if (file.size > 20 * 1024 * 1024) return toast.error("Max 20MB");

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("chat-attachments").upload(path, file, { upsert: false });
    if (error) return toast.error(error.message);

    const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);

    try {
      await onSend("", { url: pub.publicUrl, name: file.name, type: kind });
    } catch (e: any) {
      toast.error(e.message);
    }

  };

  return (<div className="border-t border-gray-200 bg-white/80 backdrop-blur-xl px-4 py-4"> <div className="flex items-end gap-3"> <div className="flex items-center gap-2">
    <Button type="button" variant="ghost" size="icon" onClick={() => imageRef.current?.click()} className="rounded-full bg-pink-50 hover:bg-pink-100"> <ImageIcon className="h-4 w-4 text-pink-500" /> </Button>

    <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} className="rounded-full bg-purple-50 hover:bg-purple-100">
      <Paperclip className="h-4 w-4 text-purple-500" />
    </Button>
  </div>

    <input ref={imageRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "image"); e.target.value = ""; }} />
    <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "file"); e.target.value = ""; }} />

    <div className="relative flex flex-1 items-end rounded-full bg-gray-100 px-2 shadow-inner">
      <Textarea
        value={text}
        onChange={(e) => { setText(e.target.value); onTyping(); }}
        onKeyDown={onKey}
        disabled={disabled}
        rows={1}
        placeholder="Send message..."
        className="max-h-40 min-h-[46px] resize-none border-0 bg-transparent px-4 py-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="mb-1 rounded-full">
            <Smile className="h-5 w-5 text-gray-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64 rounded-2xl p-2">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className="rounded-md p-1 text-xl hover:bg-gray-100"
                onClick={() => setText((t) => t + e)}
              >
                {e}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>

    <Button
      onClick={send}
      disabled={!text.trim() || sending}
      size="icon"
      className="h-11 w-11 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg"
    >
      <Send className="h-4 w-4" />
    </Button>
  </div>
  </div>

  );
};
