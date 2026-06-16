use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FirebaseRules {
    pub version: String,
    pub services: Vec<Service>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Service {
    pub name: String,
    pub matches: Vec<Match>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Match {
    pub path: String,
    pub allows: Vec<Allow>,
    pub nested_matches: Vec<Match>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Allow {
    pub methods: Vec<String>,
    pub condition: String,
}
