use crate::ast::{FirebaseRules, Match};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SecurityReport {
    pub risk_score: u8,
    pub vulnerabilities: Vec<Vulnerability>,
}

#[derive(Debug, Serialize)]
pub struct Vulnerability {
    pub path: String,
    pub severity: String,
    pub description: String,
    pub recommendation: String,
}

pub struct SecurityAnalyzer;

impl SecurityAnalyzer {
    pub fn analyze(rules: &FirebaseRules) -> SecurityReport {
        let mut vulnerabilities = Vec::new();
        let mut risk_score = 0;

        // Basic static analysis logic
        for service in &rules.services {
            for m in &service.matches {
                Self::recursive_analyze(m, &mut vulnerabilities, &mut risk_score);
            }
        }

        SecurityReport {
            risk_score: risk_score.min(100),
            vulnerabilities,
        }
    }

    fn recursive_analyze(m: &Match, vulnerabilities: &mut Vec<Vulnerability>, risk_score: &mut u8) {
        for allow in &m.allows {
            if allow.condition.trim() == "true" || allow.condition.trim() == "if true" {
                vulnerabilities.push(Vulnerability {
                    path: m.path.clone(),
                    severity: "CRITICAL".to_string(),
                    description: format!("Wildcard access allowed for methods: {:?}", allow.methods),
                    recommendation: "Implement proper authentication and resource ownership checks.".to_string(),
                });
                *risk_score += 40;
            }
        }

        for nm in &m.nested_matches {
            Self::recursive_analyze(nm, vulnerabilities, risk_score);
        }
    }
}
