// Rich seed data for blog and portfolio with comprehensive content

export const seedBlogPosts = [
  {
    title: "LoRaWAN in IoT: Deep Technical Analysis",
    slug: "lorawan-iot-deep-dive",
    excerpt: "Comprehensive exploration of LoRaWAN protocol architecture, performance optimization, and real-world deployment strategies.",
    content: `# LoRaWAN in IoT: Deep Technical Analysis

## Introduction
LoRaWAN represents a paradigm shift in long-range, low-power wireless communication for the Internet of Things. This deep dive explores the technical architecture, implementation strategies, and optimization techniques critical for successful deployments.

## Protocol Architecture

### Physical Layer (PHY)
- **Frequency Bands**: 868 MHz (EU), 915 MHz (US), 923 MHz (AS), regional variations
- **Bandwidth**: 125 kHz, 250 kHz, 500 kHz (FSK mode)
- **Spreading Factor**: SF7-SF12 (Range vs Data Rate trade-off)
- **Coding Rate**: 4/5, 4/6, 4/7, 4/8
- **Modulation**: LoRa (proprietary) for long-range, FSK for high data rate

### Data Rate Calculation
\`\`\`
DR = SF * BW / 2^SF
Example: SF7, 125kHz = 7 * 125,000 / 128 = 6,836 bps ≈ 6.8 kbps
\`\`\`

## Hardware Engineering Considerations

### Transceiver Selection
- **SX1272/73**: Low cost, proven in production environments
- **SX1276/77/78**: Enhanced performance, better sensitivity (-134 dBm)
- **LR1110**: Integrated GNSS, ultra-low power, multi-band
- **SX1280**: 2.4 GHz band, higher data rates, shorter range

### Power Budget Analysis
- Transmit Power: 2-20 dBm (typical: 14 dBm)
- Receiver Sensitivity: -137 to -130 dBm (depending on SF)
- Minimum Power Loss: Path Loss < Transmit Power - Sensitivity + Margin (10-15 dB)
- Link Budget = TX Power - Path Loss - Fading Margin = Minimum RX Sensitivity

### Antenna Design
- **Omni-directional**: ¼ wave (17 cm @ 868 MHz), gain ≈ 2 dBi
- **Directional arrays**: Yagi or patch for targeted deployment
- **Impedance matching**: Critical for >90% efficiency
- **Cable loss**: -0.2 dB/m typical coaxial cable

## Real-World Deployment Patterns

### Gateway Architecture
- **Multi-channel reception**: Simultaneous monitoring of 8+ channels
- **Backhaul options**: WiFi, Ethernet, Cellular (LTE-M, NB-IoT)
- **Processing strategy**: Local filtering vs Cloud processing trade-offs
- **Redundancy**: Multiple gateways for coverage overlap and fault tolerance

### Network Optimization
- **Adaptive Data Rate (ADR)**: Automatic SF/DR adjustment based on link quality
- **Duty cycle compliance**: Sub-band limitations (1% airtime in EU, 0.1% in specific bands)
- **Link budget calculation**: Margin planning for seasonal/environmental variations
- **Time synchronization**: GPS or NTP for gateway coordination

### Interference Management
- **Collision avoidance**: Random backoff (0-2s typical)
- **Capture effect**: Strong signal can suppress weaker signals
- **Friis formula**: TX power + TX antenna gain - path loss - RX antenna gain
- **Co-channel mitigation**: Frequency hopping, different SFs

## Advanced Topics

### Encryption & Security
- **Network Session Key (NwkSKey)**: Network-level encryption
- **Application Session Key (AppSKey)**: Application-level encryption
- **Join Procedure**: OTAA (Over-The-Air Activation) vs ABP (Activation By Personalization)
- **DevNonce & JoinNonce**: Preventing replay attacks

### Performance Benchmarks

| Spreading Factor | Range (ideal) | Data Rate | Airtime (51B) | Symbol Time |
|---|---|---|---|---|
| SF7 | 2-5 km | 5.47 kbps | 41 ms | 1 ms |
| SF9 | 5-10 km | 1.37 kbps | 163 ms | 4 ms |
| SF12 | 10-15 km | 0.29 kbps | 1,648 ms | 32 ms |

## Practical Implementation Guide

### Device Code Example (Pseudo)
\`\`\`
1. Initialize radio chip (SPI config)
2. Configure frequency and spreading factor
3. Set TX power and modulation
4. Implement state machine (idle, TX, RX, sleep)
5. Handle acknowledgments and retransmission
6. Manage battery and power states
\`\`\`

## Conclusion
Successful LoRaWAN deployments require deep understanding of the protocol stack, careful hardware selection, rigorous network design, and continuous optimization based on real-world conditions.`,
    category: "Hardware Engineering",
    tags: ["IoT", "LoRaWAN", "Networking", "Hardware", "RF Design", "Wireless"],
    readTimeMinutes: 18,
  },
  {
    title: "MEL Systems: Monitoring Framework Deep Dive",
    slug: "mel-monitoring-framework",
    excerpt: "Advanced methodological insights into designing, implementing, and validating comprehensive Monitoring, Evaluation, and Learning systems.",
    content: `# MEL Systems: Monitoring Framework Deep Dive

## Core MEL Principles

### Monitoring
- **Definition**: Ongoing systematic collection and analysis of data on program implementation
- **Frequency**: Real-time, daily, weekly, monthly depending on indicators
- **Data Quality**: Validation rules, error checking, source verification
- **Responsibility**: Field teams, supervisors, data managers

### Evaluation
- **Formative**: Ongoing process improvement (Baseline → Midline → Endline)
- **Summative**: Impact assessment and outcome validation
- **Counterfactual**: Understanding what would have happened without intervention
- **Rigor Levels**: Descriptive, quasi-experimental, experimental

### Learning
- **Knowledge Management**: Documenting insights and lessons learned
- **Adaptive Management**: Using data to adjust strategies in real-time
- **Knowledge Sharing**: Communicating findings to stakeholders
- **Continuous Improvement**: Iterative cycles of action and reflection

## Data Flow Architecture

\`\`\`
Program Theory of Change
    ↓
Indicator Identification (Impact/Outcome/Output/Process)
    ↓
Data Collection Design (Primary/Secondary Sources)
    ↓
Data Collection & Entry (ODK, KoboToolbox, direct surveys)
    ↓
Data Validation & Cleaning (QA checks, outlier analysis)
    ↓
Analysis & Interpretation (Descriptive, correlative, causal)
    ↓
Reporting & Visualization (Dashboards, reports, briefs)
    ↓
Learning & Decision-Making (Stakeholder workshops, strategy sessions)
    ↓
Program Adjustment & Iteration
\`\`\`

## Indicator Design Framework

### SMART Criteria
- **Specific**: Clear, unambiguous definition with operational guidance
- **Measurable**: Quantifiable or observable with specific units
- **Achievable**: Realistic within program context and resources
- **Relevant**: Directly tied to program objectives and outcomes
- **Time-bound**: Collection schedule clearly defined

### Indicator Hierarchy
1. **Impact Indicators** (Long-term, 3-5 years): Societal-level change
2. **Outcome Indicators** (Medium-term, 1-2 years): Behavioral/institutional change
3. **Output Indicators** (Short-term, 6-12 months): Direct deliverables
4. **Process Indicators** (Operational, monthly): Implementation fidelity

### Data Quality Dimensions
- **Accuracy**: Data reflects true values
- **Completeness**: All required data collected
- **Timeliness**: Data available when needed
- **Consistency**: Data aligns across sources
- **Validity**: Measurement captures intended construct

## Data Management Systems

### Collection Methods
- **Direct surveys**: Face-to-face interviews (high cost, high quality)
- **Administrative data**: Existing records (low cost, potential bias)
- **Remote sensing**: Satellite imagery, GIS analysis
- **Mobile data collection**: ODK, KoboToolbox, CommCare
- **Focus groups**: Qualitative insights on barriers and enablers

### Quality Assurance Protocol
- Field verification protocols (spot-check 10-20% of surveys)
- Double entry verification (2 independent data entry operators)
- Outlier detection (statistical analysis, contextual review)
- Completeness and timeliness checks (dashboard monitoring)
- Source triangulation (cross-referencing multiple sources)

## Analysis Techniques

### Quantitative
- Descriptive statistics (mean, median, SD, distribution)
- Trend analysis (time series, growth rates)
- Correlation analysis (relationship strength)
- Difference-in-differences (causal inference)
- Regression models (controlling for confounders)

### Qualitative
- Thematic coding (pattern identification)
- Content analysis (frequency of themes)
- Narrative analysis (story-based understanding)
- Framework analysis (structured interpretation)

## Reporting & Visualization
- Dashboard design (real-time monitoring)
- Data storytelling (narrative + visuals)
- Infographics (key findings at a glance)
- Interactive tools (stakeholder engagement)
- Brief formats (1-pagers for quick decision-making)`,
    category: "MEL Systems",
    tags: ["Monitoring", "Evaluation", "Learning", "Data Management", "Program Design"],
    readTimeMinutes: 16,
  },
];

export const seedPortfolioProjects = [
  {
    title: "Mtendere Education Consult - Full-Stack Platform Delivery",
    slug: "mtendere-education-platform",
    description: "A public education-consultancy platform and administrative workspace. This study is limited to inspectable engineering evidence; it makes no client adoption, revenue, or operational-impact claim.",
    challenge: "Deliver a maintainable web platform for public information and operational workflows while keeping data, role boundaries, and release work under control. Client performance metrics and acceptance records are not public evidence and are deliberately excluded.",
    solution: `## Evidence scope
This case study is based on the project's source repository, migration history, and automated tests. It does not present private client data, public-service availability, or unsupported business outcomes.

## Engineering contribution
- React and TypeScript client with a Node.js and Express service layer.
- PostgreSQL and Drizzle-backed data model with recorded migrations.
- Public content and application flows alongside protected administration, role, and MFA-related test coverage.
- Test suites for unit, integration, end-to-end, and smoke scenarios are maintained in the repository.

## Release evidence
- The portfolio release records the exact verification commands and outcomes in its release note.
- The public source repository is linked for direct inspection.
- Operational adoption, turnaround-time, engagement, and partner claims remain out of scope until a client-approved evidence record exists.`,
    outcome: "Evidence status: source-backed delivery case study. Client outcome metrics and public-service availability are not published as verified facts.",
    category: "Full-Stack Delivery",
    techStack: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Drizzle ORM", "Tailwind CSS", "Vite"],
    images: [],
    featured: true,
    liveUrl: null,
    githubUrl: "https://github.com/Chrispine-1210/MEC",
    order: 1,
  },
  {
    title: "Aöthothe Enterprise OS - Governed Commercial Foundation",
    slug: "aothothe-enterprise-os-commercial-foundation",
    description: "An internal enterprise operating-system slice for governed catalogues, pricing, proposals, and quotations. It is presented as a draft engineering release, not as a deployed product or customer deployment.",
    challenge: "Create controlled commercial workflows that preserve price history, prevent unauthorized changes, and retain decision evidence before any client or financial activity is enabled.",
    solution: `## Delivered in the recorded draft
- Governed catalogue, pricing, proposal, and quotation workflows with evidence-backed price overrides and maker-checker approval.
- Versioned templates, immutable approved history, database-enforced lifecycle controls, protected commercial UI, and audit/evidence views.
- Clean and populated migration checks, strict TypeScript and production-build checks, security review, secret scan, licence policy, and dependency audit.

## Verification record
The draft pull request records 37/37 integration and service tests and 18/18 Playwright desktop/mobile journeys. It also records a successful production build and zero high-severity production dependency vulnerabilities.

## Release boundary
The pull request remains a draft and its recorded decision is HOLD. GitHub Actions startup failure is unresolved; the work is not merged to the protected release line, deployed, connected to live pricing/taxes, or used for contracts, collections, or client operations.`,
    outcome: "Evidence status: draft engineering release with recorded local verification. No production deployment, client usage, revenue, security-certification, or operational-outcome claim is made.",
    category: "Enterprise Systems",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Playwright", "RBAC", "Audit Evidence"],
    images: [],
    featured: true,
    liveUrl: null,
    order: 2,
  },
];
