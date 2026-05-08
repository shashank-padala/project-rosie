CREATE TABLE cases (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  user_id                     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sample_name                 TEXT NOT NULL,
  species                     TEXT NOT NULL DEFAULT 'canis_lupus_familiaris',
  alleles                     TEXT[] NOT NULL DEFAULT '{}',
  predictors                  TEXT[] NOT NULL DEFAULT '{NetMHCpan}',
  status                      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','scoring','reporting','designing','completed','failed')),
  candidates_json             JSONB,
  clinical_report_md          TEXT,
  mrna_fasta                  TEXT,
  mrna_summary_md             TEXT,
  binding_affinity_img_b64    TEXT,
  mutation_landscape_img_b64  TEXT,
  total_mutations             INTEGER,
  candidates_after_filtering  INTEGER,
  error_message               TEXT
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_cases" ON cases
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "demo_cases_public" ON cases
  FOR SELECT USING (user_id IS NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE cases;
