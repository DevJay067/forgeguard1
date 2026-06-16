use crate::ast::{FirebaseRules, Service, Match, Allow};
use anyhow::Result;
use regex::Regex;

pub fn parse_rules(input: &str) -> Result<FirebaseRules> {
    let mut services = Vec::new();
    
    let service_re = Regex::new(r"service\s+([a-zA-Z0-9_.]+)").unwrap();
    let match_re = Regex::new(r"match\s+([^\{]+)\s*\{").unwrap();
    let allow_re = Regex::new(r"allow\s+([^:]+):\s*if\s+([^;]+);").unwrap();
    
    let mut current_service: Option<Service> = None;
    let mut current_match_stack: Vec<Match> = Vec::new();
    
    for line in input.lines() {
        let line = line.trim();
        
        if let Some(caps) = service_re.captures(line) {
            if let Some(srv) = current_service.take() {
                services.push(srv);
            }
            current_service = Some(Service {
                name: caps.get(1).unwrap().as_str().to_string(),
                matches: Vec::new(),
            });
        } else if let Some(caps) = match_re.captures(line) {
            let m = Match {
                path: caps.get(1).unwrap().as_str().trim().to_string(),
                allows: Vec::new(),
                nested_matches: Vec::new(),
            };
            current_match_stack.push(m);
        } else if let Some(caps) = allow_re.captures(line) {
            if let Some(m) = current_match_stack.last_mut() {
                let methods: Vec<String> = caps.get(1).unwrap().as_str()
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect();
                m.allows.push(Allow {
                    methods,
                    condition: caps.get(2).unwrap().as_str().trim().to_string(),
                });
            }
        } else if line == "}" {
            if let Some(m) = current_match_stack.pop() {
                if let Some(parent) = current_match_stack.last_mut() {
                    parent.nested_matches.push(m);
                } else if let Some(ref mut srv) = current_service {
                    srv.matches.push(m);
                }
            } else if let Some(srv) = current_service.take() {
                services.push(srv);
            }
        }
    }
    
    if let Some(srv) = current_service {
        services.push(srv);
    }

    Ok(FirebaseRules {
        version: "2".to_string(),
        services,
    })
}
