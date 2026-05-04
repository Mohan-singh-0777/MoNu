
-- Make conversation creation RPCs SECURITY DEFINER so RLS on inserts isn't an issue
CREATE OR REPLACE FUNCTION public.create_direct_conversation(_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _conversation_id uuid;
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to start a chat';
  END IF;

  IF _other_user_id IS NULL OR _other_user_id = _current_user THEN
    RAISE EXCEPTION 'Choose another user to start a chat';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _other_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT c.id INTO _conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp_me
    ON cp_me.conversation_id = c.id AND cp_me.user_id = _current_user
  JOIN public.conversation_participants cp_other
    ON cp_other.conversation_id = c.id AND cp_other.user_id = _other_user_id
  WHERE c.type = 'direct'
    AND (
      SELECT count(*) FROM public.conversation_participants cp_count
      WHERE cp_count.conversation_id = c.id
    ) = 2
  ORDER BY c.created_at ASC
  LIMIT 1;

  IF _conversation_id IS NOT NULL THEN
    RETURN _conversation_id;
  END IF;

  INSERT INTO public.conversations (type, created_by)
  VALUES ('direct', _current_user)
  RETURNING id INTO _conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  VALUES
    (_conversation_id, _current_user, false),
    (_conversation_id, _other_user_id, false);

  RETURN _conversation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_group_conversation(_name text, _member_ids uuid[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_user uuid := auth.uid();
  _conversation_id uuid;
  _clean_name text := nullif(trim(_name), '');
  _members uuid[];
BEGIN
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to create a group';
  END IF;

  IF _clean_name IS NULL THEN
    RAISE EXCEPTION 'Group name is required';
  END IF;

  SELECT array_agg(DISTINCT member_id) INTO _members
  FROM unnest(COALESCE(_member_ids, ARRAY[]::uuid[])) AS member_id
  WHERE member_id IS NOT NULL AND member_id <> _current_user;

  IF COALESCE(array_length(_members, 1), 0) < 2 THEN
    RAISE EXCEPTION 'Pick at least 2 people';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(_members) AS member_id
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = member_id)
  ) THEN
    RAISE EXCEPTION 'One or more selected users no longer exist';
  END IF;

  INSERT INTO public.conversations (type, name, created_by)
  VALUES ('group', _clean_name, _current_user)
  RETURNING id INTO _conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  VALUES (_conversation_id, _current_user, true);

  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  SELECT _conversation_id, member_id, false
  FROM unnest(_members) AS member_id;

  RETURN _conversation_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_direct_conversation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_group_conversation(text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_conversation(text, uuid[]) TO authenticated;

-- ============================================
-- CALLS (1:1 audio/video like Instagram)
-- ============================================
CREATE TYPE public.call_type AS ENUM ('audio', 'video');
CREATE TYPE public.call_status AS ENUM ('ringing', 'accepted', 'declined', 'ended', 'missed');

CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  call_type public.call_type NOT NULL DEFAULT 'video',
  status public.call_status NOT NULL DEFAULT 'ringing',
  started_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz
);

CREATE INDEX idx_calls_callee_status ON public.calls(callee_id, status);
CREATE INDEX idx_calls_caller_status ON public.calls(caller_id, status);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their calls" ON public.calls
  FOR SELECT TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

CREATE POLICY "Caller can create calls" ON public.calls
  FOR INSERT TO authenticated
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Participants can update their calls" ON public.calls
  FOR UPDATE TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- WebRTC signaling messages (offer/answer/ice)
CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  signal_type text NOT NULL, -- 'offer' | 'answer' | 'ice'
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_signals_to ON public.call_signals(to_user, call_id);

ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients can view signals" ON public.call_signals
  FOR SELECT TO authenticated
  USING (to_user = auth.uid() OR from_user = auth.uid());

CREATE POLICY "Authenticated can send signals from self" ON public.call_signals
  FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
ALTER TABLE public.calls REPLICA IDENTITY FULL;
ALTER TABLE public.call_signals REPLICA IDENTITY FULL;
