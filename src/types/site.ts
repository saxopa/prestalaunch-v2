export type SiteStatus = "running" | "stopped" | "starting" | "error";

export interface Site {
  id: string;
  name: string;
  domain: string;
  ps_version: string;
  php_version: string;
  mysql_version: string;
  port: number;
  pma_port: number;
  ssl_port: number | null;
  mail_port: number | null;
  status: SiteStatus;
  created_at: string;
}

export interface SiteTemplate {
  id: string;
  name: string;
  ps_version: string;
  php_version: string;
  mysql_version: string;
  is_default: number;
  user_created: number;
}

export interface CreateSiteInput {
  name: string;
  domain: string;
  ps_version: string;
  php_version: string;
  mysql_version: string;
}
