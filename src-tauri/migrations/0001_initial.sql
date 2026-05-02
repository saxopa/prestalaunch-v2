CREATE TABLE IF NOT EXISTS sites (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    domain      TEXT NOT NULL UNIQUE,
    ps_version  TEXT NOT NULL,
    php_version TEXT NOT NULL,
    mysql_version TEXT NOT NULL DEFAULT '8.0',
    port        INTEGER NOT NULL UNIQUE,
    pma_port    INTEGER NOT NULL UNIQUE,
    status      TEXT NOT NULL DEFAULT 'stopped',
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    ps_version  TEXT NOT NULL,
    php_version TEXT NOT NULL,
    mysql_version TEXT NOT NULL,
    is_default  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Templates prédéfinis
INSERT OR IGNORE INTO templates (id, name, ps_version, php_version, mysql_version, is_default) VALUES
    ('tpl-standard', 'Standard',  '8.1.7', '8.2', '8.0', 1),
    ('tpl-legacy',   'Legacy',    '1.7.8', '7.4', '5.7', 0),
    ('tpl-dev',      'Dev (PHP latest)', '8.1.7', '8.3', '8.0', 0);

-- Paramètre onboarding
INSERT OR IGNORE INTO settings (key, value) VALUES ('onboarding_done', 'false');
