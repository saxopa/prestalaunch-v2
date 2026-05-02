use std::net::TcpListener;
use std::path::PathBuf;
use sqlx::SqlitePool;

pub fn site_dir(app_data_dir: &PathBuf, site_id: &str) -> PathBuf {
    app_data_dir.join("sites").join(site_id)
}

pub struct ComposeConfig<'a> {
    pub site_id: &'a str,
    pub domain: &'a str,
    pub ps_version: &'a str,
    pub mysql_version: &'a str,
    pub port: i64,
    pub pma_port: i64,
    pub ssl_port: Option<i64>,
    pub mail_port: Option<i64>,
}

pub async fn find_free_ports(pool: &SqlitePool) -> Result<(i64, i64, i64, i64), String> {
    let used: Vec<i64> =
        sqlx::query_scalar(
            "SELECT port FROM sites \
             UNION SELECT pma_port FROM sites \
             UNION SELECT ssl_port FROM sites WHERE ssl_port IS NOT NULL \
             UNION SELECT mail_port FROM sites WHERE mail_port IS NOT NULL",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    let port      = scan_port(8000, &used);
    let pma_port  = scan_port(9000, &used);
    let ssl_port  = scan_port(8400, &used);
    let mail_port = scan_port(8500, &used);
    Ok((port as i64, pma_port as i64, ssl_port as i64, mail_port as i64))
}

fn scan_port(start: u16, used: &[i64]) -> u16 {
    for p in start..65000 {
        if !used.contains(&(p as i64)) && TcpListener::bind(("127.0.0.1", p)).is_ok() {
            return p;
        }
    }
    start
}

pub fn generate_compose(cfg: ComposeConfig) -> String {
    let nginx_service = cfg.ssl_port.map(|sp| format!(
        r#"
  nginx:
    image: nginx:alpine
    container_name: pl_{site_id}_nginx
    restart: unless-stopped
    depends_on:
      - prestashop
    ports:
      - "{sp}:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/certs:ro
    networks:
      - net
"#,
        site_id = cfg.site_id, sp = sp,
    )).unwrap_or_default();

    let mailpit_service = cfg.mail_port.map(|mp| format!(
        r#"
  mailpit:
    image: axllent/mailpit:latest
    container_name: pl_{site_id}_mailpit
    restart: unless-stopped
    ports:
      - "{mp}:8025"
    networks:
      - net
"#,
        site_id = cfg.site_id, mp = mp,
    )).unwrap_or_default();

    format!(
        r#"services:
  mysql:
    image: mysql:{mysql_version}
    container_name: pl_{site_id}_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: prestashop
      MYSQL_DATABASE: prestashop
      MYSQL_USER: prestashop
      MYSQL_PASSWORD: prestashop
    volumes:
      - ./mysql:/var/lib/mysql
    networks:
      - net

  prestashop:
    image: prestashop/prestashop:{ps_version}
    container_name: pl_{site_id}_ps
    restart: unless-stopped
    depends_on:
      - mysql
    ports:
      - "{port}:80"
    environment:
      DB_SERVER: mysql
      DB_NAME: prestashop
      DB_USER: prestashop
      DB_PASSWD: prestashop
      PS_DOMAIN: "{domain}:{port}"
      PS_LANGUAGE: fr
      PS_COUNTRY: FR
      PS_INSTALL_AUTO: "1"
      ADMIN_MAIL: admin@admin.com
      ADMIN_PASSWD: Prestashop1!
    volumes:
      - ./prestashop:/var/www/html
    networks:
      - net

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: pl_{site_id}_pma
    restart: unless-stopped
    depends_on:
      - mysql
    ports:
      - "{pma_port}:80"
    environment:
      PMA_HOST: mysql
      PMA_USER: root
      PMA_PASSWORD: prestashop
    networks:
      - net
{nginx_service}{mailpit_service}
networks:
  net:
    driver: bridge
"#,
        site_id = cfg.site_id,
        domain = cfg.domain,
        ps_version = cfg.ps_version,
        mysql_version = cfg.mysql_version,
        port = cfg.port,
        pma_port = cfg.pma_port,
        nginx_service = nginx_service,
        mailpit_service = mailpit_service,
    )
}

pub fn generate_nginx_conf(domain: &str, ps_port: i64) -> String {
    format!(
        r#"events {{}}
http {{
    server {{
        listen 443 ssl;
        server_name {domain};

        ssl_certificate /certs/cert.pem;
        ssl_certificate_key /certs/key.pem;

        location / {{
            proxy_pass http://prestashop:80;
            proxy_set_header Host {domain}:{ps_port};
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }}
    }}
}}
"#,
        domain = domain,
        ps_port = ps_port,
    )
}
