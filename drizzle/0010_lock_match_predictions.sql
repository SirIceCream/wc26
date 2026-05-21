CREATE OR REPLACE FUNCTION public.prevent_locked_match_predictions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_match_id uuid;
BEGIN
  target_match_id := COALESCE(NEW.match_id, OLD.match_id);

  IF EXISTS (
    SELECT 1
    FROM public.matches
    WHERE matches.id = target_match_id
      AND matches.locked_at <= now()
  ) THEN
    RAISE EXCEPTION 'Match predictions are locked after kickoff';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS predictions_lock_before_write ON public.predictions;

CREATE TRIGGER predictions_lock_before_write
BEFORE INSERT OR UPDATE OR DELETE ON public.predictions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_match_predictions();
