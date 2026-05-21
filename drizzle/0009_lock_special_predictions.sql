CREATE OR REPLACE FUNCTION public.prevent_locked_special_predictions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF now() >= timestamptz '2026-06-11 19:00:00+00' THEN
    RAISE EXCEPTION 'Special predictions are locked after kickoff'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS special_predictions_lock_before_write ON public.special_predictions;
--> statement-breakpoint
CREATE TRIGGER special_predictions_lock_before_write
BEFORE INSERT OR UPDATE OR DELETE ON public.special_predictions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_special_predictions();
