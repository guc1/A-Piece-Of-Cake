CREATE TYPE report_highlight_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

CREATE TABLE report_highlights (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id),
    report_type report_highlight_type NOT NULL,
    target_slug text NOT NULL,
    block_id text NOT NULL,
    start_offset integer NOT NULL,
    end_offset integer NOT NULL,
    color text NOT NULL,
    snippet text NOT NULL,
    created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX report_highlights_unique_idx
    ON report_highlights (user_id, report_type, target_slug, block_id, start_offset, end_offset);

CREATE INDEX report_highlights_user_type_created_idx
    ON report_highlights (user_id, report_type, created_at DESC);
