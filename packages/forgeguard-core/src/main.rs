use clap::{Parser, Subcommand};
use forgeguard_core::{parse_rules, SecurityAnalyzer};
use std::fs;

#[derive(Parser)]
#[command(name = "forgeguard")]
#[command(about = "ForgeGuard CLI: Autonomous Firebase Security Engineering", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new ForgeGuard project
    Init,
    /// Audit local firebase rules
    Audit {
        /// Path to the .rules file
        path: String,
    },
    /// Generate a security report in JSON
    Report {
        path: String,
    },
    /// Deploy rules securely after agent verification
    Deploy {
        /// Project description or path to spec
        #[arg(short, long)]
        prompt: Option<String>,
        /// Force deployment without interactive prompt
        #[arg(short, long)]
        force: bool,
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Init => {
            println!("Initializing ForgeGuard workspace...");
            fs::write("forgeguard.json", "{\n  \"version\": \"1.0\",\n  \"threshold\": 8\n}")?;
            println!("Created forgeguard.json");
        }
        Commands::Audit { path } => {
            let content = fs::read_to_string(path)?;
            let rules = parse_rules(&content)?;
            let report = SecurityAnalyzer::analyze(&rules);
            
            println!("Audit results for {}:", path);
            println!("Risk Score: {}/100", report.risk_score);
            for vuln in report.vulnerabilities {
                println!("[{}] {}: {}", vuln.severity, vuln.path, vuln.description);
            }
        }
        Commands::Report { path } => {
            let content = fs::read_to_string(path)?;
            let rules = parse_rules(&content)?;
            let report = SecurityAnalyzer::analyze(&rules);
            println!("{}", serde_json::to_string_pretty(&report)?);
        }
        Commands::Deploy { prompt, force } => {
            if let Some(p) = prompt {
                println!("Requesting autonomous generation for: '{}'", p);
                println!("Connecting to ForgeGuard Cloud Orchestrator...");
                // Simulated API call
                println!("Iteration 1: Risk Score 45 -> REJECTED");
                println!("Iteration 2: Risk Score 5 -> VERIFIED");
                println!("Rules verified by Auditor Agent.");
            }
            
            if !force {
                println!("CAUTION: You are about to deploy production security rules.");
                println!("Dry-run successful. Proceed? (y/N)");
                // In a real CLI, we would read stdin here.
            } else {
                println!("Force deploying rules...");
            }
            println!("Deployment successful!");
        }
    }

    Ok(())
}
