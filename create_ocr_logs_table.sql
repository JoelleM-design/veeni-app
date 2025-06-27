-- Suivi des appels à l'OCR
CREATE TABLE public.ocr_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  image_count integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Activez Row Level Security pour la table
ALTER TABLE public.ocr_logs ENABLE ROW LEVEL SECURITY;

-- Créez une politique qui permet aux utilisateurs de voir leurs propres logs
CREATE POLICY "Allow individual read access"
ON public.ocr_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Créez une politique qui permet aux fonctions de service (comme les Edge Functions) d'insérer des logs
CREATE POLICY "Allow service-role inserts"
ON public.ocr_logs
FOR INSERT
WITH CHECK (true); 