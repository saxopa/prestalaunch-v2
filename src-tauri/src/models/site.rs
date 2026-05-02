use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Site {
    pub id: String,
    pub name: String,
    pub domain: String,
    pub ps_version: String,
    pub php_version: String,
    pub mysql_version: String,
    pub port: i64,
    pub pma_port: i64,
    pub ssl_port: Option<i64>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSiteInput {
    pub name: String,
    pub domain: String,
    pub ps_version: String,
    pub php_version: String,
    pub mysql_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SiteTemplate {
    pub id: String,
    pub name: String,
    pub ps_version: String,
    pub php_version: String,
    pub mysql_version: String,
    pub is_default: i64,
}
