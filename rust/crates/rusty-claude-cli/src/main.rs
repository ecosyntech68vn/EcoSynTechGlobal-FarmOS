mod input;
mod render;

use std::env;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use api::{
    AnthropicClient, ContentBlockDelta, InputContentBlock, InputMessage, MessageRequest,
    MessageResponse, OutputContentBlock, StreamEvent as ApiStreamEvent, ToolChoice, ToolDefinition,
    ToolResultContentBlock,
};

use commands::{handle_slash_command, render_slash_command_help, SlashCommand};
use compat_harness::{extract_manifest, UpstreamPaths};
use render::{Spinner, TerminalRenderer};
use runtime::{
    load_system_prompt, ApiClient, ApiRequest, AssistantEvent, CompactionConfig, ConfigLoader,
    ConfigSource, ContentBlock, ConversationMessage, ConversationRuntime, MessageRole,
    PermissionMode, PermissionPolicy, ProjectContext, RuntimeError, Session, TokenUsage, ToolError,
    ToolExecutor, UsageTracker,
};
use tools::{execute_tool, mvp_tool_specs};

const DEFAULT_MODEL: &str = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS: u32 = 32;
const DEFAULT_DATE: &str = "2026-03-31";

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().skip(1).collect();
    match parse_args(&args)? {
        CliAction::DumpManifests => dump_manifests(),
        CliAction::BootstrapPlan => print_bootstrap_plan(),
        CliAction::PrintSystemPrompt { cwd, date } => print_system_prompt(cwd, date),
        CliAction::ResumeSession {
            session_path,
            commands,
        } => resume_session(&session_path, &commands),
        CliAction::Prompt { prompt, model } => LiveCli::new(model, false)?.run_turn(&prompt)?,
        CliAction::Repl { model } => run_repl(model)?,
        CliAction::Help => print_help(),
    }
    Ok(())
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum CliAction {
    DumpManifests,
    BootstrapPlan,
    PrintSystemPrompt {
        cwd: PathBuf,
        date: String,
    },
    ResumeSession {
        session_path: PathBuf,
        commands: Vec<String>,
    },
    Prompt {
        prompt: String,
        model: String,
    },
    Repl {
        model: String,
    },
    Help,
}

fn parse_args(args: &[String]) -> Result<CliAction, String> {
    let mut model = DEFAULT_MODEL.to_string();
    let mut rest = Vec::new();
    let mut index = 0;

    while index < args.len() {
        match args[index].as_str() {
            "--model" => {
                let value = args
                    .get(index + 1)
                    .ok_or_else(|| "missing value for --model".to_string())?;
                model.clone_from(value);
                index += 2;
            }
            flag if flag.starts_with("--model=") => {
                model = flag[8..].to_string();
                index += 1;
            }
            other => {
                rest.push(other.to_string());
                index += 1;
            }
        }
    }

    if rest.is_empty() {
        return Ok(CliAction::Repl { model });
    }
    if matches!(rest.first().map(String::as_str), Some("--help" | "-h")) {
        return Ok(CliAction::Help);
    }
    if rest.first().map(String::as_str) == Some("--resume") {
        return parse_resume_args(&rest[1..]);
    }

    match rest[0].as_str() {
        "dump-manifests" => Ok(CliAction::DumpManifests),
        "bootstrap-plan" => Ok(CliAction::BootstrapPlan),
        "system-prompt" => parse_system_prompt_args(&rest[1..]),
        "prompt" => {
            let prompt = rest[1..].join(" ");
            if prompt.trim().is_empty() {
                return Err("prompt subcommand requires a prompt string".to_string());
            }
            Ok(CliAction::Prompt { prompt, model })
        }
        other => Err(format!("unknown subcommand: {other}")),
    }
}

fn parse_system_prompt_args(args: &[String]) -> Result<CliAction, String> {
    let mut cwd = env::current_dir().map_err(|error| error.to_string())?;
    let mut date = DEFAULT_DATE.to_string();
    let mut index = 0;

    while index < args.len() {
        match args[index].as_str() {
            "--cwd" => {
                let value = args
                    .get(index + 1)
                    .ok_or_else(|| "missing value for --cwd".to_string())?;
                cwd = PathBuf::from(value);
                index += 2;
            }
            "--date" => {
                let value = args
                    .get(index + 1)
                    .ok_or_else(|| "missing value for --date".to_string())?;
                date.clone_from(value);
                index += 2;
            }
            other => return Err(format!("unknown system-prompt option: {other}")),
        }
    }

    Ok(CliAction::PrintSystemPrompt { cwd, date })
}

fn parse_resume_args(args: &[String]) -> Result<CliAction, String> {
    let session_path = args
        .first()
        .ok_or_else(|| "missing session path for --resume".to_string())
        .map(PathBuf::from)?;
    let commands = args[1..].to_vec();
    if commands
        .iter()
        .any(|command| !command.trim_start().starts_with('/'))
    {
        return Err("--resume trailing arguments must be slash commands".to_string());
    }
    Ok(CliAction::ResumeSession {
        session_path,
        commands,
    })
}

fn dump_manifests() {
    let workspace_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    let paths = UpstreamPaths::from_workspace_dir(&workspace_dir);
    match extract_manifest(&paths) {
        Ok(manifest) => {
            println!("commands: {}", manifest.commands.entries().len());
            println!("tools: {}", manifest.tools.entries().len());
            println!("bootstrap phases: {}", manifest.bootstrap.phases().len());
        }
        Err(error) => {
            eprintln!("failed to extract manifests: {error}");
            std::process::exit(1);
        }
    }
}

fn print_bootstrap_plan() {
    for phase in runtime::BootstrapPlan::claude_code_default().phases() {
        println!("- {phase:?}");
    }
}

fn print_system_prompt(cwd: PathBuf, date: String) {
    match load_system_prompt(cwd, date, env::consts::OS, "unknown") {
        Ok(sections) => println!("{}", sections.join("\n\n")),
        Err(error) => {
            eprintln!("failed to build system prompt: {error}");
            std::process::exit(1);
        }
    }
}

fn resume_session(session_path: &Path, commands: &[String]) {
    let session = match Session::load_from_path(session_path) {
        Ok(session) => session,
        Err(error) => {
            eprintln!("failed to restore session: {error}");
            std::process::exit(1);
        }
    };

    if commands.is_empty() {
        println!(
            "Restored session from {} ({} messages).",
            session_path.display(),
            session.messages.len()
        );
        return;
    }

    let mut session = session;
    for raw_command in commands {
        let Some(command) = SlashCommand::parse(raw_command) else {
            eprintln!("unsupported resumed command: {raw_command}");
            std::process::exit(2);
        };
        match run_resume_command(session_path, &session, &command) {
            Ok(ResumeCommandOutcome {
                session: next_session,
                message,
            }) => {
                session = next_session;
                if let Some(message) = message {
                    println!("{message}");
                }
            }
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(2);
            }
        }
    }
}

#[derive(Debug, Clone)]
struct ResumeCommandOutcome {
    session: Session,
    message: Option<String>,
}

fn run_resume_command(
    session_path: &Path,
    session: &Session,
    command: &SlashCommand,
) -> Result<ResumeCommandOutcome, Box<dyn std::error::Error>> {
    match command {
        SlashCommand::Help => Ok(ResumeCommandOutcome {
            session: session.clone(),
            message: Some(render_repl_help()),
        }),
        SlashCommand::Compact => {
            let Some(result) = handle_slash_command(
                "/compact",
                session,
                CompactionConfig {
                    max_estimated_tokens: 0,
                    ..CompactionConfig::default()
                },
            ) else {
                return Ok(ResumeCommandOutcome {
                    session: session.clone(),
                    message: None,
                });
            };
            result.session.save_to_path(session_path)?;
            Ok(ResumeCommandOutcome {
                session: result.session,
                message: Some(result.message),
            })
        }
        SlashCommand::Clear => {
            let cleared = Session::new();
            cleared.save_to_path(session_path)?;
            Ok(ResumeCommandOutcome {
                session: cleared,
                message: Some(format!(
                    "Cleared resumed session file {}.",
                    session_path.display()
                )),
            })
        }
        SlashCommand::Status => {
            let tracker = UsageTracker::from_session(session);
            let usage = tracker.cumulative_usage();
            Ok(ResumeCommandOutcome {
                session: session.clone(),
                message: Some(format_status_line(
                    "restored-session",
                    session.messages.len(),
                    tracker.turns(),
                    tracker.current_turn_usage(),
                    usage,
                    0,
                    permission_mode_label(),
                )),
            })
        }
        SlashCommand::Cost => {
            let usage = UsageTracker::from_session(session).cumulative_usage();
            Ok(ResumeCommandOutcome {
                session: session.clone(),
                message: Some(format!(
                    "cost: input_tokens={} output_tokens={} cache_creation_tokens={} cache_read_tokens={} total_tokens={}",
                    usage.input_tokens,
                    usage.output_tokens,
                    usage.cache_creation_input_tokens,
                    usage.cache_read_input_tokens,
                    usage.total_tokens(),
                )),
            })
        }
        SlashCommand::Config => Ok(ResumeCommandOutcome {
            session: session.clone(),
            message: Some(render_config_report()?),
        }),
        SlashCommand::Memory => Ok(ResumeCommandOutcome {
            session: session.clone(),
            message: Some(render_memory_report()?),
        }),
        SlashCommand::Init => Ok(ResumeCommandOutcome {
            session: session.clone(),
            message: Some(init_claude_md()?),
        }),
        SlashCommand::Resume { .. }
        | SlashCommand::Model { .. }
        | SlashCommand::Permissions { .. }
        | SlashCommand::Unknown(_) => Err("unsupported resumed slash command".into()),
    }
}

fn run_repl(model: String) -> Result<(), Box<dyn std::error::Error>> {
    let mut cli = LiveCli::new(model, true)?;
    let editor = input::LineEditor::new("› ");
    println!("Rusty Claude CLI interactive mode");
    println!("Type /help for commands. Shift+Enter or Ctrl+J inserts a newline.");

    while let Some(input) = editor.read_line()? {
        let trimmed = input.trim();
        if trimmed.is_empty() {
            continue;
        }
        if matches!(trimmed, "/exit" | "/quit") {
            break;
        }
        if let Some(command) = SlashCommand::parse(trimmed) {
            cli.handle_repl_command(command)?;
            continue;
        }
        cli.run_turn(trimmed)?;
    }

    Ok(())
}

struct LiveCli {
    model: String,
    system_prompt: Vec<String>,
    runtime: ConversationRuntime<AnthropicRuntimeClient, CliToolExecutor>,
}

impl LiveCli {
    fn new(model: String, enable_tools: bool) -> Result<Self, Box<dyn std::error::Error>> {
        let system_prompt = build_system_prompt()?;
        let runtime = build_runtime(
            Session::new(),
            model.clone(),
            system_prompt.clone(),
            enable_tools,
        )?;
        Ok(Self {
            model,
            system_prompt,
            runtime,
        })
    }

    fn run_turn(&mut self, input: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut spinner = Spinner::new();
        let mut stdout = io::stdout();
        spinner.tick(
            "Waiting for Claude",
            TerminalRenderer::new().color_theme(),
            &mut stdout,
        )?;
        let result = self.runtime.run_turn(input, None);
        match result {
            Ok(_) => {
                spinner.finish(
                    "Claude response complete",
                    TerminalRenderer::new().color_theme(),
                    &mut stdout,
                )?;
                println!();
                Ok(())
            }
            Err(error) => {
                spinner.fail(
                    "Claude request failed",
                    TerminalRenderer::new().color_theme(),
                    &mut stdout,
                )?;
                Err(Box::new(error))
            }
        }
    }

    fn handle_repl_command(
        &mut self,
        command: SlashCommand,
    ) -> Result<(), Box<dyn std::error::Error>> {
        match command {
            SlashCommand::Help => println!("{}", render_repl_help()),
            SlashCommand::Status => self.print_status(),
            SlashCommand::Compact => self.compact()?,
            SlashCommand::Model { model } => self.set_model(model)?,
            SlashCommand::Permissions { mode } => self.set_permissions(mode)?,
            SlashCommand::Clear => self.clear_session()?,
            SlashCommand::Cost => self.print_cost(),
            SlashCommand::Resume { session_path } => self.resume_session(session_path)?,
            SlashCommand::Config => Self::print_config()?,
            SlashCommand::Memory => Self::print_memory()?,
            SlashCommand::Init => Self::run_init()?,
            SlashCommand::Unknown(name) => eprintln!("unknown slash command: /{name}"),
        }
        Ok(())
    }

    fn print_status(&self) {
        let cumulative = self.runtime.usage().cumulative_usage();
        let latest = self.runtime.usage().current_turn_usage();
        println!(
            "{}",
            format_status_line(
                &self.model,
                self.runtime.session().messages.len(),
                self.runtime.usage().turns(),
                latest,
                cumulative,
                self.runtime.estimated_tokens(),
                permission_mode_label(),
            )
        );
    }

    fn set_model(&mut self, model: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        let Some(model) = model else {
            println!("Current model: {}", self.model);
            return Ok(());
        };

        if model == self.model {
            println!("Model already set to {model}.");
            return Ok(());
        }

        let session = self.runtime.session().clone();
        self.runtime = build_runtime(session, model.clone(), self.system_prompt.clone(), true)?;
        self.model.clone_from(&model);
        println!("Switched model to {model}.");
        Ok(())
    }

    fn set_permissions(&mut self, mode: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
        let Some(mode) = mode else {
            println!("Current permission mode: {}", permission_mode_label());
            return Ok(());
        };

        let normalized = normalize_permission_mode(&mode).ok_or_else(|| {
            format!(
                "Unsupported permission mode '{mode}'. Use read-only, workspace-write, or danger-full-access."
            )
        })?;

        if normalized == permission_mode_label() {
            println!("Permission mode already set to {normalized}.");
            return Ok(());
        }

        let session = self.runtime.session().clone();
        self.runtime = build_runtime_with_permission_mode(
            session,
            self.model.clone(),
            self.system_prompt.clone(),
            true,
            normalized,
        )?;
        println!("Switched permission mode to {normalized}.");
        Ok(())
    }

    fn clear_session(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.runtime = build_runtime_with_permission_mode(
            Session::new(),
            self.model.clone(),
            self.system_prompt.clone(),
            true,
            permission_mode_label(),
        )?;
        println!("Cleared local session history.");
        Ok(())
    }

    fn print_cost(&self) {
        let cumulative = self.runtime.usage().cumulative_usage();
        println!(
            "cost: input_tokens={} output_tokens={} cache_creation_tokens={} cache_read_tokens={} total_tokens={}",
            cumulative.input_tokens,
            cumulative.output_tokens,
            cumulative.cache_creation_input_tokens,
            cumulative.cache_read_input_tokens,
            cumulative.total_tokens(),
        );
    }

    fn resume_session(
        &mut self,
        session_path: Option<String>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let Some(session_path) = session_path else {
            println!("Usage: /resume <session-path>");
            return Ok(());
        };

        let session = Session::load_from_path(&session_path)?;
        let message_count = session.messages.len();
        self.runtime = build_runtime_with_permission_mode(
            session,
            self.model.clone(),
            self.system_prompt.clone(),
            true,
            permission_mode_label(),
        )?;
        println!("Resumed session from {session_path} ({message_count} messages).");
        Ok(())
    }

    fn print_config() -> Result<(), Box<dyn std::error::Error>> {
        println!("{}", render_config_report()?);
        Ok(())
    }

    fn print_memory() -> Result<(), Box<dyn std::error::Error>> {
        println!("{}", render_memory_report()?);
        Ok(())
    }

    fn run_init() -> Result<(), Box<dyn std::error::Error>> {
        println!("{}", init_claude_md()?);
        Ok(())
    }

    fn compact(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let result = self.runtime.compact(CompactionConfig::default());
        let removed = result.removed_message_count;
        self.runtime = build_runtime_with_permission_mode(
            result.compacted_session,
            self.model.clone(),
            self.system_prompt.clone(),
            true,
            permission_mode_label(),
        )?;
        println!("Compacted {removed} messages.");
        Ok(())
    }
}

fn render_repl_help() -> String {
    format!(
        "{}
  /exit                Quit the REPL",
        render_slash_command_help()
    )
}

fn format_status_line(
    model: &str,
    message_count: usize,
    turns: u32,
    latest: TokenUsage,
    cumulative: TokenUsage,
    estimated_tokens: usize,
    permission_mode: &str,
) -> String {
    format!(
        "status: model={model} permission_mode={permission_mode} messages={message_count} turns={turns} estimated_tokens={estimated_tokens} latest_tokens={} cumulative_input_tokens={} cumulative_output_tokens={} cumulative_total_tokens={}",
        latest.total_tokens(),
        cumulative.input_tokens,
        cumulative.output_tokens,
        cumulative.total_tokens(),
    )
}

fn render_config_report() -> Result<String, Box<dyn std::error::Error>> {
    let cwd = env::current_dir()?;
    let loader = ConfigLoader::default_for(&cwd);
    let discovered = loader.discover();
    let runtime_config = loader.load()?;

    let mut lines = vec![format!(
        "config: loaded_files={} merged_keys={}",
        runtime_config.loaded_entries().len(),
        runtime_config.merged().len()
    )];
    for entry in discovered {
        let source = match entry.source {
            ConfigSource::User => "user",
            ConfigSource::Project => "project",
            ConfigSource::Local => "local",
        };
        let status = if runtime_config
            .loaded_entries()
            .iter()
            .any(|loaded_entry| loaded_entry.path == entry.path)
        {
            "loaded"
        } else {
            "missing"
        };
        lines.push(format!(
            "  {source:<7} {status:<7} {}",
            entry.path.display()
        ));
    }
    lines.push(format!("  merged   {}", runtime_config.as_json().render()));
    Ok(lines.join(
        "
",
    ))
}

fn render_memory_report() -> Result<String, Box<dyn std::error::Error>> {
    let project_context = ProjectContext::discover(env::current_dir()?, DEFAULT_DATE)?;
    let mut lines = vec![format!(
        "memory: files={}",
        project_context.instruction_files.len()
    )];
    if project_context.instruction_files.is_empty() {
        lines.push(
            "  No CLAUDE instruction files discovered in the current directory ancestry."
                .to_string(),
        );
    } else {
        for file in project_context.instruction_files {
            let preview = file.content.lines().next().unwrap_or("").trim();
            let preview = if preview.is_empty() {
                "<empty>"
            } else {
                preview
            };
            lines.push(format!(
                "  {} ({}) {}",
                file.path.display(),
                file.content.lines().count(),
                preview
            ));
        }
    }
    Ok(lines.join(
        "
",
    ))
}

fn init_claude_md() -> Result<String, Box<dyn std::error::Error>> {
    let cwd = env::current_dir()?;
    let claude_md = cwd.join("CLAUDE.md");
    if claude_md.exists() {
        return Ok(format!(
            "init: skipped because {} already exists",
            claude_md.display()
        ));
    }

    let content = render_init_claude_md(&cwd);
    fs::write(&claude_md, content)?;
    Ok(format!("init: created {}", claude_md.display()))
}

fn render_init_claude_md(cwd: &Path) -> String {
    let mut lines = vec![
        "# CLAUDE.md".to_string(),
        String::new(),
        "This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.".to_string(),
        String::new(),
    ];

    let mut command_lines = Vec::new();
    if cwd.join("rust").join("Cargo.toml").is_file() {
        command_lines.push("- Run Rust verification from `rust/`: `cargo fmt`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`".to_string());
    } else if cwd.join("Cargo.toml").is_file() {
        command_lines.push("- Run Rust verification from the repo root: `cargo fmt`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`".to_string());
    }
    if cwd.join("tests").is_dir() && cwd.join("src").is_dir() {
        command_lines.push("- `src/` and `tests/` are also present; check those surfaces before removing or renaming Python-era compatibility assets.".to_string());
    }
    if !command_lines.is_empty() {
        lines.push("## Verification".to_string());
        lines.extend(command_lines);
        lines.push(String::new());
    }

    let mut structure_lines = Vec::new();
    if cwd.join("rust").is_dir() {
        structure_lines.push(
            "- `rust/` contains the Rust workspace and the active CLI/runtime implementation."
                .to_string(),
        );
    }
    if cwd.join("src").is_dir() {
        structure_lines.push("- `src/` contains the older Python-first workspace artifacts referenced by the repo history and tests.".to_string());
    }
    if cwd.join("tests").is_dir() {
        structure_lines.push("- `tests/` exercises compatibility and porting behavior across the repository surfaces.".to_string());
    }
    if !structure_lines.is_empty() {
        lines.push("## Repository shape".to_string());
        lines.extend(structure_lines);
        lines.push(String::new());
    }

    lines.push("## Working agreement".to_string());
    lines.push("- Prefer small, reviewable Rust changes and keep slash-command behavior aligned between the shared command registry and the CLI entrypoints.".to_string());
    lines.push("- Do not overwrite existing CLAUDE.md content automatically; update it intentionally when repo workflows change.".to_string());
    lines.push(String::new());

    lines.join(
        "
",
    )
}

fn normalize_permission_mode(mode: &str) -> Option<&'static str> {
    match mode.trim() {
        "read-only" => Some("read-only"),
        "workspace-write" => Some("workspace-write"),
        "danger-full-access" => Some("danger-full-access"),
        _ => None,
    }
}

fn permission_mode_label() -> &'static str {
    match env::var("RUSTY_CLAUDE_PERMISSION_MODE") {
        Ok(value) if value == "read-only" => "read-only",
        Ok(value) if value == "danger-full-access" => "danger-full-access",
        _ => "workspace-write",
    }
}

fn build_system_prompt() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    Ok(load_system_prompt(
        env::current_dir()?,
        DEFAULT_DATE,
        env::consts::OS,
        "unknown",
    )?)
}

fn build_runtime(
    session: Session,
    model: String,
    system_prompt: Vec<String>,
    enable_tools: bool,
) -> Result<ConversationRuntime<AnthropicRuntimeClient, CliToolExecutor>, Box<dyn std::error::Error>>
{
    build_runtime_with_permission_mode(
        session,
        model,
        system_prompt,
        enable_tools,
        permission_mode_label(),
    )
}

fn build_runtime_with_permission_mode(
    session: Session,
    model: String,
    system_prompt: Vec<String>,
    enable_tools: bool,
    permission_mode: &str,
) -> Result<ConversationRuntime<AnthropicRuntimeClient, CliToolExecutor>, Box<dyn std::error::Error>>
{
    Ok(ConversationRuntime::new(
        session,
        AnthropicRuntimeClient::new(model, enable_tools)?,
        CliToolExecutor::new(),
        permission_policy(permission_mode),
        system_prompt,
    ))
}

struct AnthropicRuntimeClient {
    runtime: tokio::runtime::Runtime,
    client: AnthropicClient,
    model: String,
    enable_tools: bool,
}

impl AnthropicRuntimeClient {
    fn new(model: String, enable_tools: bool) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            runtime: tokio::runtime::Runtime::new()?,
            client: AnthropicClient::from_env()?,
            model,
            enable_tools,
        })
    }
}

impl ApiClient for AnthropicRuntimeClient {
    #[allow(clippy::too_many_lines)]
    fn stream(&mut self, request: ApiRequest) -> Result<Vec<AssistantEvent>, RuntimeError> {
        let message_request = MessageRequest {
            model: self.model.clone(),
            max_tokens: DEFAULT_MAX_TOKENS,
            messages: convert_messages(&request.messages),
            system: (!request.system_prompt.is_empty()).then(|| request.system_prompt.join("\n\n")),
            tools: self.enable_tools.then(|| {
                mvp_tool_specs()
                    .into_iter()
                    .map(|spec| ToolDefinition {
                        name: spec.name.to_string(),
                        description: Some(spec.description.to_string()),
                        input_schema: spec.input_schema,
                    })
                    .collect()
            }),
            tool_choice: self.enable_tools.then_some(ToolChoice::Auto),
            stream: true,
        };

        self.runtime.block_on(async {
            let mut stream = self
                .client
                .stream_message(&message_request)
                .await
                .map_err(|error| RuntimeError::new(error.to_string()))?;
            let mut stdout = io::stdout();
            let mut events = Vec::new();
            let mut pending_tool: Option<(String, String, String)> = None;
            let mut saw_stop = false;

            while let Some(event) = stream
                .next_event()
                .await
                .map_err(|error| RuntimeError::new(error.to_string()))?
            {
                match event {
                    ApiStreamEvent::MessageStart(start) => {
                        for block in start.message.content {
                            push_output_block(block, &mut stdout, &mut events, &mut pending_tool)?;
                        }
                    }
                    ApiStreamEvent::ContentBlockStart(start) => {
                        push_output_block(
                            start.content_block,
                            &mut stdout,
                            &mut events,
                            &mut pending_tool,
                        )?;
                    }
                    ApiStreamEvent::ContentBlockDelta(delta) => match delta.delta {
                        ContentBlockDelta::TextDelta { text } => {
                            if !text.is_empty() {
                                write!(stdout, "{text}")
                                    .and_then(|()| stdout.flush())
                                    .map_err(|error| RuntimeError::new(error.to_string()))?;
                                events.push(AssistantEvent::TextDelta(text));
                            }
                        }
                        ContentBlockDelta::InputJsonDelta { partial_json } => {
                            if let Some((_, _, input)) = &mut pending_tool {
                                input.push_str(&partial_json);
                            }
                        }
                    },
                    ApiStreamEvent::ContentBlockStop(_) => {
                        if let Some((id, name, input)) = pending_tool.take() {
                            events.push(AssistantEvent::ToolUse { id, name, input });
                        }
                    }
                    ApiStreamEvent::MessageDelta(delta) => {
                        events.push(AssistantEvent::Usage(TokenUsage {
                            input_tokens: delta.usage.input_tokens,
                            output_tokens: delta.usage.output_tokens,
                            cache_creation_input_tokens: 0,
                            cache_read_input_tokens: 0,
                        }));
                    }
                    ApiStreamEvent::MessageStop(_) => {
                        saw_stop = true;
                        events.push(AssistantEvent::MessageStop);
                    }
                }
            }

            if !saw_stop
                && events.iter().any(|event| {
                    matches!(event, AssistantEvent::TextDelta(text) if !text.is_empty())
                        || matches!(event, AssistantEvent::ToolUse { .. })
                })
            {
                events.push(AssistantEvent::MessageStop);
            }

            if events
                .iter()
                .any(|event| matches!(event, AssistantEvent::MessageStop))
            {
                return Ok(events);
            }

            let response = self
                .client
                .send_message(&MessageRequest {
                    stream: false,
                    ..message_request.clone()
                })
                .await
                .map_err(|error| RuntimeError::new(error.to_string()))?;
            response_to_events(response, &mut stdout)
        })
    }
}

fn push_output_block(
    block: OutputContentBlock,
    out: &mut impl Write,
    events: &mut Vec<AssistantEvent>,
    pending_tool: &mut Option<(String, String, String)>,
) -> Result<(), RuntimeError> {
    match block {
        OutputContentBlock::Text { text } => {
            if !text.is_empty() {
                write!(out, "{text}")
                    .and_then(|()| out.flush())
                    .map_err(|error| RuntimeError::new(error.to_string()))?;
                events.push(AssistantEvent::TextDelta(text));
            }
        }
        OutputContentBlock::ToolUse { id, name, input } => {
            *pending_tool = Some((id, name, input.to_string()));
        }
    }
    Ok(())
}

fn response_to_events(
    response: MessageResponse,
    out: &mut impl Write,
) -> Result<Vec<AssistantEvent>, RuntimeError> {
    let mut events = Vec::new();
    let mut pending_tool = None;

    for block in response.content {
        push_output_block(block, out, &mut events, &mut pending_tool)?;
        if let Some((id, name, input)) = pending_tool.take() {
            events.push(AssistantEvent::ToolUse { id, name, input });
        }
    }

    events.push(AssistantEvent::Usage(TokenUsage {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens,
        cache_read_input_tokens: response.usage.cache_read_input_tokens,
    }));
    events.push(AssistantEvent::MessageStop);
    Ok(events)
}

struct CliToolExecutor {
    renderer: TerminalRenderer,
}

impl CliToolExecutor {
    fn new() -> Self {
        Self {
            renderer: TerminalRenderer::new(),
        }
    }
}

impl ToolExecutor for CliToolExecutor {
    fn execute(&mut self, tool_name: &str, input: &str) -> Result<String, ToolError> {
        let value = serde_json::from_str(input)
            .map_err(|error| ToolError::new(format!("invalid tool input JSON: {error}")))?;
        match execute_tool(tool_name, &value) {
            Ok(output) => {
                let markdown = format!("### Tool `{tool_name}`\n\n```json\n{output}\n```\n");
                self.renderer
                    .stream_markdown(&markdown, &mut io::stdout())
                    .map_err(|error| ToolError::new(error.to_string()))?;
                Ok(output)
            }
            Err(error) => Err(ToolError::new(error)),
        }
    }
}

fn permission_policy(mode: &str) -> PermissionPolicy {
    if normalize_permission_mode(mode) == Some("read-only") {
        PermissionPolicy::new(PermissionMode::Deny)
            .with_tool_mode("read_file", PermissionMode::Allow)
            .with_tool_mode("glob_search", PermissionMode::Allow)
            .with_tool_mode("grep_search", PermissionMode::Allow)
    } else {
        PermissionPolicy::new(PermissionMode::Allow)
    }
}

fn convert_messages(messages: &[ConversationMessage]) -> Vec<InputMessage> {
    messages
        .iter()
        .filter_map(|message| {
            let role = match message.role {
                MessageRole::System | MessageRole::User | MessageRole::Tool => "user",
                MessageRole::Assistant => "assistant",
            };
            let content = message
                .blocks
                .iter()
                .map(|block| match block {
                    ContentBlock::Text { text } => InputContentBlock::Text { text: text.clone() },
                    ContentBlock::ToolUse { id, name, input } => InputContentBlock::ToolUse {
                        id: id.clone(),
                        name: name.clone(),
                        input: serde_json::from_str(input)
                            .unwrap_or_else(|_| serde_json::json!({ "raw": input })),
                    },
                    ContentBlock::ToolResult {
                        tool_use_id,
                        output,
                        is_error,
                        ..
                    } => InputContentBlock::ToolResult {
                        tool_use_id: tool_use_id.clone(),
                        content: vec![ToolResultContentBlock::Text {
                            text: output.clone(),
                        }],
                        is_error: *is_error,
                    },
                })
                .collect::<Vec<_>>();
            (!content.is_empty()).then(|| InputMessage {
                role: role.to_string(),
                content,
            })
        })
        .collect()
}

fn print_help() {
    println!("rusty-claude-cli");
    println!();
    println!("Usage:");
    println!("  rusty-claude-cli [--model MODEL]             Start interactive REPL");
    println!(
        "  rusty-claude-cli [--model MODEL] prompt TEXT Send one prompt and stream the response"
    );
    println!("  rusty-claude-cli dump-manifests");
    println!("  rusty-claude-cli bootstrap-plan");
    println!("  rusty-claude-cli system-prompt [--cwd PATH] [--date YYYY-MM-DD]");
    println!("  rusty-claude-cli --resume SESSION.json [/status] [/compact] [...]");
}

#[cfg(test)]
mod tests {
    use super::{
        format_status_line, normalize_permission_mode, parse_args, render_init_claude_md,
        render_repl_help, CliAction, SlashCommand, DEFAULT_MODEL,
    };
    use runtime::{ContentBlock, ConversationMessage, MessageRole};
    use std::path::{Path, PathBuf};

    #[test]
    fn defaults_to_repl_when_no_args() {
        assert_eq!(
            parse_args(&[]).expect("args should parse"),
            CliAction::Repl {
                model: DEFAULT_MODEL.to_string(),
            }
        );
    }

    #[test]
    fn parses_prompt_subcommand() {
        let args = vec![
            "prompt".to_string(),
            "hello".to_string(),
            "world".to_string(),
        ];
        assert_eq!(
            parse_args(&args).expect("args should parse"),
            CliAction::Prompt {
                prompt: "hello world".to_string(),
                model: DEFAULT_MODEL.to_string(),
            }
        );
    }

    #[test]
    fn parses_system_prompt_options() {
        let args = vec![
            "system-prompt".to_string(),
            "--cwd".to_string(),
            "/tmp/project".to_string(),
            "--date".to_string(),
            "2026-04-01".to_string(),
        ];
        assert_eq!(
            parse_args(&args).expect("args should parse"),
            CliAction::PrintSystemPrompt {
                cwd: PathBuf::from("/tmp/project"),
                date: "2026-04-01".to_string(),
            }
        );
    }

    #[test]
    fn parses_resume_flag_with_slash_command() {
        let args = vec![
            "--resume".to_string(),
            "session.json".to_string(),
            "/compact".to_string(),
        ];
        assert_eq!(
            parse_args(&args).expect("args should parse"),
            CliAction::ResumeSession {
                session_path: PathBuf::from("session.json"),
                commands: vec!["/compact".to_string()],
            }
        );
    }

    #[test]
    fn parses_resume_flag_with_multiple_slash_commands() {
        let args = vec![
            "--resume".to_string(),
            "session.json".to_string(),
            "/status".to_string(),
            "/compact".to_string(),
            "/cost".to_string(),
        ];
        assert_eq!(
            parse_args(&args).expect("args should parse"),
            CliAction::ResumeSession {
                session_path: PathBuf::from("session.json"),
                commands: vec![
                    "/status".to_string(),
                    "/compact".to_string(),
                    "/cost".to_string(),
                ],
            }
        );
    }

    #[test]
    fn repl_help_includes_shared_commands_and_exit() {
        let help = render_repl_help();
        assert!(help.contains("/help"));
        assert!(help.contains("/status"));
        assert!(help.contains("/model [model]"));
        assert!(help.contains("/permissions [read-only|workspace-write|danger-full-access]"));
        assert!(help.contains("/clear"));
        assert!(help.contains("/cost"));
        assert!(help.contains("/resume <session-path>"));
        assert!(help.contains("/config"));
        assert!(help.contains("/memory"));
        assert!(help.contains("/init"));
        assert!(help.contains("/exit"));
    }

    #[test]
    fn status_line_reports_model_and_token_totals() {
        let status = format_status_line(
            "claude-sonnet",
            7,
            3,
            runtime::TokenUsage {
                input_tokens: 5,
                output_tokens: 4,
                cache_creation_input_tokens: 1,
                cache_read_input_tokens: 0,
            },
            runtime::TokenUsage {
                input_tokens: 20,
                output_tokens: 8,
                cache_creation_input_tokens: 2,
                cache_read_input_tokens: 1,
            },
            128,
            "workspace-write",
        );
        assert!(status.contains("model=claude-sonnet"));
        assert!(status.contains("permission_mode=workspace-write"));
        assert!(status.contains("messages=7"));
        assert!(status.contains("latest_tokens=10"));
        assert!(status.contains("cumulative_total_tokens=31"));
    }

    #[test]
    fn normalizes_supported_permission_modes() {
        assert_eq!(normalize_permission_mode("read-only"), Some("read-only"));
        assert_eq!(
            normalize_permission_mode("workspace-write"),
            Some("workspace-write")
        );
        assert_eq!(
            normalize_permission_mode("danger-full-access"),
            Some("danger-full-access")
        );
        assert_eq!(normalize_permission_mode("unknown"), None);
    }

    #[test]
    fn parses_resume_and_config_slash_commands() {
        assert_eq!(
            SlashCommand::parse("/resume saved-session.json"),
            Some(SlashCommand::Resume {
                session_path: Some("saved-session.json".to_string())
            })
        );
        assert_eq!(SlashCommand::parse("/config"), Some(SlashCommand::Config));
        assert_eq!(SlashCommand::parse("/memory"), Some(SlashCommand::Memory));
        assert_eq!(SlashCommand::parse("/init"), Some(SlashCommand::Init));
    }

    #[test]
    fn init_template_mentions_detected_rust_workspace() {
        let rendered = render_init_claude_md(Path::new("."));
        assert!(rendered.contains("# CLAUDE.md"));
        assert!(rendered.contains("cargo clippy --workspace --all-targets -- -D warnings"));
    }

    #[test]
    fn converts_tool_roundtrip_messages() {
        let messages = vec![
            ConversationMessage::user_text("hello"),
            ConversationMessage::assistant(vec![ContentBlock::ToolUse {
                id: "tool-1".to_string(),
                name: "bash".to_string(),
                input: "{\"command\":\"pwd\"}".to_string(),
            }]),
            ConversationMessage {
                role: MessageRole::Tool,
                blocks: vec![ContentBlock::ToolResult {
                    tool_use_id: "tool-1".to_string(),
                    tool_name: "bash".to_string(),
                    output: "ok".to_string(),
                    is_error: false,
                }],
                usage: None,
            },
        ];

        let converted = super::convert_messages(&messages);
        assert_eq!(converted.len(), 3);
        assert_eq!(converted[1].role, "assistant");
        assert_eq!(converted[2].role, "user");
    }
}
