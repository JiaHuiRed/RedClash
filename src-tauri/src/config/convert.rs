//! 分享链接直链订阅 -> clash yaml 转换。
//!
//! 部分机场订阅源只返回 `vless://`（或 base64 编码的 vless）分享链接文本，
//! 而 mihomo/RedClash 只认 clash yaml。直接 `serde_yaml_ng` 解析这类文本会失败，
//! 导致订阅的 `proxies` 解析为空（星辰加速就是这个病根）。
//!
//! 本模块提供：检测 body 是否为 vless 直链 -> 逐条解析 -> 原地组装成完整 clash yaml
//! （proxies + proxy-groups + rules），使订阅能像常规 clash 订阅一样被客户端消费。

use base64::{Engine as _, engine::general_purpose::STANDARD};
use percent_encoding::percent_decode_str;
use reqwest_dav::re_exports::url::form_urlencoded;
use serde_yaml_ng::{Mapping, Value};

/// 组装出的兜底代理组名。
const GROUP_NAME: &str = "Global";

/// 顶层检测 + 转换入口。
///
/// 若 `data` 是合法 clash yaml 或不是 vless 直链，返回 `None`（由调用方按原逻辑处理）；
/// 若是 vless 直链且转换成功，返回转换后的完整 clash yaml 字符串。
pub fn convert_share_link(data: &str) -> Option<String> {
    let plain = decode_body(data)?;
    let proxies = parse_vless_links(&plain)?;
    if proxies.is_empty() {
        return None;
    }
    let root = build_full_config(&proxies);
    serde_yaml_ng::to_string(&root).ok()
}

/// 把订阅 body 解码成明文多行 `vless://` 文本。
///
/// 支持三种形态：
/// 1. 明文本就含 `vless://`；
/// 2. 整体 base64（去掉空白后整个 decode）；
/// 3. 逐行 base64（节点级编码）。
fn decode_body(data: &str) -> Option<String> {
    if data.contains("vless://") {
        return Some(data.to_string());
    }

    // 整体 base64
    let compact: String = data.chars().filter(|c| !c.is_whitespace()).collect();
    if !compact.is_empty() {
        if let Ok(bytes) = STANDARD.decode(compact.as_bytes()) {
            if let Ok(text) = String::from_utf8(bytes) {
                if text.contains("vless://") {
                    return Some(text);
                }
            }
        }
    }

    // 逐行 base64（节点级编码）
    let mut out = String::new();
    let mut any = false;
    for line in data.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if let Ok(bytes) = STANDARD.decode(line.as_bytes()) {
            if let Ok(text) = String::from_utf8(bytes) {
                if text.contains("vless://") {
                    out.push_str(&text);
                    out.push('\n');
                    any = true;
                    continue;
                }
            }
        }
        out.push_str(line);
        out.push('\n');
    }

    if any { Some(out) } else { None }
}

/// 从明文多行文本中逐行解析出 vless proxy mapping 列表。
fn parse_vless_links(plain: &str) -> Option<Vec<Mapping>> {
    let mut proxies = Vec::new();
    for line in plain.lines() {
        let line = line.trim();
        if let Some(uri) = line.strip_prefix("vless://") {
            if let Some(proxy) = parse_vless(uri) {
                proxies.push(proxy);
            }
        }
    }
    if proxies.is_empty() { None } else { Some(proxies) }
}

/// 解析单条 `vless://` 链接为 clash vless proxy mapping。
fn parse_vless(uri: &str) -> Option<Mapping> {
    // 分离 fragment（节点名）
    let (body, frag) = match uri.split_once('#') {
        Some((b, f)) => (b, Some(f)),
        None => (uri, None),
    };

    let name = frag_to_name(frag).unwrap_or_else(|| "vless".to_string());

    // uuid@server:port?query
    let (uuid, hostport) = body.split_once('@')?;
    let (server, rest) = hostport.split_once(':')?;
    let (port, query) = match rest.split_once('?') {
        Some((p, q)) => (p, Some(q)),
        None => (rest, None),
    };
    if uuid.is_empty() || server.is_empty() || port.is_empty() {
        return None;
    }

    // 解析 query 参数
    let mut params = std::collections::HashMap::new();
    if let Some(q) = query {
        for (k, v) in form_urlencoded::parse(q.as_bytes()) {
            params.insert(k.to_string(), v.to_string());
        }
    }

    let net = params.get("type").cloned().unwrap_or_else(|| "tcp".into());
    let security = params.get("security").cloned().unwrap_or_else(|| "none".into());
    let is_tls = security == "tls" || security == "reality";

    let mut p = Mapping::new();
    p.insert(Value::from("name"), Value::from(name));
    p.insert(Value::from("type"), Value::from("vless"));
    p.insert(Value::from("server"), Value::from(server));
    p.insert(Value::from("port"), Value::from(port));
    p.insert(Value::from("uuid"), Value::from(uuid));
    p.insert(Value::from("udp"), Value::from(true));
    if is_tls {
        p.insert(Value::from("tls"), Value::from(true));
    }
    if net != "tcp" {
        p.insert(Value::from("network"), Value::from(net.clone()));
    }

    if let Some(sni) = params.get("sni") {
        if !sni.is_empty() {
            p.insert(Value::from("servername"), Value::from(sni.clone()));
        }
    }
    if let Some(fp) = params.get("fp") {
        if !fp.is_empty() {
            p.insert(Value::from("client-fingerprint"), Value::from(fp.clone()));
        }
    }
    if let Some(flow) = params.get("flow") {
        if !flow.is_empty() {
            p.insert(Value::from("flow"), Value::from(flow.clone()));
        }
    }
    if let Some(alpn) = params.get("alpn") {
        if !alpn.is_empty() {
            let list: Vec<Value> = alpn.split(',').map(|s| Value::from(s.to_string())).collect();
            p.insert(Value::from("alpn"), Value::Sequence(list));
        }
    }
    let insecure = params
        .get("allowInsecure")
        .or_else(|| params.get("allowinsecure"))
        .map(|s| s == "1" || s.eq_ignore_ascii_case("true"))
        .unwrap_or(false);
    if insecure {
        p.insert(Value::from("skip-cert-verify"), Value::from(true));
    }

    // reality 支持
    if security == "reality" {
        if let Some(pbk) = params.get("pbk") {
            let mut ro = Mapping::new();
            ro.insert(Value::from("public-key"), Value::from(pbk.clone()));
            if let Some(sid) = params.get("sid") {
                if !sid.is_empty() {
                    ro.insert(Value::from("short-id"), Value::from(sid.clone()));
                }
            }
            p.insert(Value::from("reality-opts"), Value::Mapping(ro));
        }
    }

    // 传输层参数（ws / grpc）
    match net.as_str() {
        "ws" => {
            let path = params.get("path").cloned().unwrap_or_default();
            let host = params.get("host").cloned().unwrap_or_default();
            if !path.is_empty() || !host.is_empty() {
                let mut ws = Mapping::new();
                if !path.is_empty() {
                    ws.insert(Value::from("path"), Value::from(path));
                }
                if !host.is_empty() {
                    let mut hdrs = Mapping::new();
                    hdrs.insert(Value::from("Host"), Value::from(host));
                    ws.insert(Value::from("headers"), Value::Mapping(hdrs));
                }
                p.insert(Value::from("ws-opts"), Value::Mapping(ws));
            }
        }
        "grpc" => {
            if let Some(sn) = params.get("serviceName") {
                if !sn.is_empty() {
                    let mut g = Mapping::new();
                    g.insert(Value::from("grpc-service-name"), Value::from(sn.clone()));
                    p.insert(Value::from("grpc-opts"), Value::Mapping(g));
                }
            }
        }
        _ => {}
    }

    Some(p)
}

/// 从 fragment（URL 编码的节点名）解析出展示名，并去掉 `[type]` 前缀。
fn frag_to_name(frag: Option<&str>) -> Option<String> {
    let frag = frag?;
    let decoded = percent_decode_str(frag).decode_utf8().ok()?.to_string();
    let decoded = decoded.replace('+', " ");
    let name = if decoded.starts_with('[') {
        match decoded.find("] ") {
            Some(i) => decoded[i + 2..].to_string(),
            None => decoded.split(']').nth(1).map(|s| s.to_string()).unwrap_or(decoded),
        }
    } else {
        decoded
    };
    let name = name.trim().to_string();
    if name.is_empty() { None } else { Some(name) }
}

/// 组装成完整 clash yaml（proxies + proxy-group + rules），供客户端直接消费。
fn build_full_config(proxies: &[Mapping]) -> Mapping {
    let proxy_seq: Vec<Value> = proxies.iter().map(|p| Value::Mapping(p.clone())).collect();

    let names: Vec<Value> = proxies
        .iter()
        .filter_map(|p| {
            p.get("name")
                .and_then(|v| v.as_str())
                .map(|s| Value::from(s.to_string()))
        })
        .collect();

    let mut group = Mapping::new();
    group.insert(Value::from("name"), Value::from(GROUP_NAME));
    group.insert(Value::from("type"), Value::from("select"));
    group.insert(Value::from("proxies"), Value::Sequence(names));

    let mut root = Mapping::new();
    root.insert(Value::from("proxies"), Value::Sequence(proxy_seq));
    root.insert(
        Value::from("proxy-groups"),
        Value::Sequence(vec![Value::Mapping(group)]),
    );
    root.insert(
        Value::from("rules"),
        Value::Sequence(vec![Value::from(format!("MATCH,{GROUP_NAME}"))]),
    );
    root
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_LINK: &str = "vless://be26b8a6-230a-4d13-b64e-56766d93302a@198.62.62.81:443?mode=multi&security=tls&encryption=none&type=ws&fp=firefox&sni=JoGyLS-6551.mamame.store&path=%2Fapi%2Fmwjxr0uE8cqJw8Nso6&host=JoGyLS-6551.mamame.store#%5Bvless%5D%F0%9F%87%AC%F0%9F%87%A7+UnitedKingdom1+%C3%971";

    #[test]
    fn convert_plain_vless_link() {
        let yaml = convert_share_link(SAMPLE_LINK).expect("should convert");
        let root: Mapping = serde_yaml_ng::from_str(&yaml).expect("result should be valid yaml");

        let proxies = root.get("proxies").and_then(Value::as_sequence).unwrap();
        assert_eq!(proxies.len(), 1);

        let proxy = proxies[0].as_mapping().unwrap();
        assert_eq!(proxy.get("server").and_then(Value::as_str), Some("198.62.62.81"));
        assert_eq!(proxy.get("port").and_then(Value::as_str), Some("443"));
        assert_eq!(
            proxy.get("uuid").and_then(Value::as_str),
            Some("be26b8a6-230a-4d13-b64e-56766d93302a")
        );
        assert_eq!(proxy.get("network").and_then(Value::as_str), Some("ws"));
        assert_eq!(
            proxy.get("servername").and_then(Value::as_str),
            Some("JoGyLS-6551.mamame.store")
        );
        assert_eq!(proxy.get("client-fingerprint").and_then(Value::as_str), Some("firefox"));

        // name 应去掉 [vless] 前缀，保留 flags + 节点名
        assert_eq!(proxy.get("name").and_then(Value::as_str), Some("🇬🇧 UnitedKingdom1 ×1"));

        // ws-opts path / host
        let wsopts = proxy.get("ws-opts").and_then(Value::as_mapping).unwrap();
        assert_eq!(
            wsopts.get("path").and_then(Value::as_str),
            Some("/api/mwjxr0uE8cqJw8Nso6")
        );
        let headers = wsopts.get("headers").and_then(Value::as_mapping).unwrap();
        assert_eq!(
            headers.get("Host").and_then(Value::as_str),
            Some("JoGyLS-6551.mamame.store")
        );

        // root 含 proxy-groups 和 rules
        assert!(root.get("proxy-groups").and_then(Value::as_sequence).is_some());
        assert!(root.get("rules").and_then(Value::as_sequence).is_some());
    }

    #[test]
    fn ignore_non_vless_input() {
        let normal_yaml = "proxies:\n  - name: a\n    type: ss\nproxy-groups: []\n";
        assert_eq!(convert_share_link(normal_yaml), None);

        assert_eq!(convert_share_link("not a subscription at all"), None);
    }

    #[test]
    fn convert_base64_whole_body() {
        let encoded = STANDARD.encode(SAMPLE_LINK.as_bytes());
        let yaml = convert_share_link(&encoded).expect("should decode base64 and convert");
        let root: Mapping = serde_yaml_ng::from_str(&yaml).unwrap();
        assert_eq!(
            root.get("proxies").and_then(Value::as_sequence).map(|s| s.len()),
            Some(1)
        );
    }
}
