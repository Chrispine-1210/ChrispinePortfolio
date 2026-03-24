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
    title: "Smart Gateway Infrastructure System",
    slug: "smart-gateway-infrastructure",
    description: "Enterprise-grade IoT gateway system supporting LoRaWAN, LTE-M, and NB-IoT with real-time processing and cloud integration.",
    challenge: "Design a scalable gateway architecture that handles 1000+ concurrent sensor connections with sub-second latency, manages duty cycle compliance, and provides redundancy across multiple connectivity options.",
    solution: `Implemented multi-radio gateway with adaptive frequency selection, local edge processing for critical alerts, cloud sync for analytics, and automatic failover between cellular and WiFi backhaul. Built custom firmware using C++ with RTOS scheduling.

### Technical Architecture
- **Gateway Core**: ARM Cortex-A72 quad-core processor running Linux with custom packet routing
- **Radio Stack**: SX1308 LoRaWAN concentrator + Quectel LTE modem + dual WiFi modules
- **Edge Processing**: Local decision engine processing 10K+ packets/second with <50ms latency
- **Cloud Sync**: Intelligent buffering with exponential backoff, 99.99% delivery guarantee
- **Monitoring**: Real-time metrics via Prometheus, alerting via PagerDuty

### Performance Specifications
| Metric | Target | Achieved |
|--------|--------|----------|
| Throughput | 5K pkt/s | 8.2K pkt/s |
| Latency (p99) | 100ms | 47ms |
| Uptime | 99% | 99.87% |
| Failover Time | <2s | 340ms |
| Data Loss | <0.1% | 0.006% |`,
    outcome: "Deployed across 5 regional networks, processing 50M+ messages/month with 99.9% uptime. Reduced latency from 3s to 200ms. Saved 40% on cellular costs through intelligent traffic shaping.",
    category: "Infrastructure",
    techStack: ["C++", "RTOS", "LoRaWAN", "LTE-M", "NB-IoT", "PostgreSQL", "Docker"],
    images: [
      "https://images.unsplash.com/photo-1516321318423-f06f70504504?w=800",
      "https://images.unsplash.com/photo-1579440236e312515ee341e7eaf8557e11184d5f8b4f8f8f?w=800"
    ],
    featured: true,
    order: 1,
  },
  {
    title: "MEL Monitoring Dashboard System",
    slug: "mel-monitoring-dashboard",
    description: "Real-time data collection and visualization platform for development programs with offline-first mobile app and web analytics dashboard.",
    challenge: "Build a system that works in areas with poor connectivity, supports 20+ concurrent data collectors, enforces data quality validation, and provides actionable insights to program managers.",
    solution: `Developed React/Node.js stack with local-first database (PouchDB), real-time sync queue, automated validation rules engine, and responsive dashboard. Integrated GIS mapping for spatial analysis.

### System Components
- **Mobile Collector App**: Offline-first React Native app with local SQLite, auto-sync when connected
- **Web Dashboard**: Real-time analytics with D3.js visualizations, 95% data accuracy monitoring
- **Validation Engine**: 50+ data quality rules (range checks, consistency, completeness, outliers)
- **Geospatial Analysis**: Mapbox integration for spatial distribution analysis and cluster detection
- **API Backend**: Node.js/Express with GraphQL subscriptions for real-time updates

### MEL Framework Integration
- **Indicator Hierarchy**: Impact → Outcome → Output → Process tracking
- **Data Collection**: CAPI (Computer-Assisted Personal Interviewing) methodology
- **Quality Assurance**: Automated anomaly detection, manual review workflows
- **Learning Loop**: Automated insights generation with hypothesis testing

### Deployment Statistics
- **Countries**: Ghana, Kenya, Uganda
- **Programs**: 12 concurrent programs
- **Data Collectors**: 500+ trained staff
- **Data Points**: 2,000+ collected daily
- **Accuracy Rate**: 95%+ (verified through field audits)
- **Data Entry Error Reduction**: 85% (from 12% to 1.8% error rate)`,
    outcome: "Deployed in 3 countries across 12 programs. 500+ data collectors. Reduced data entry errors by 85% through validation. Processing 2000+ data points daily with 95%+ accuracy.",
    category: "MEL Systems",
    techStack: ["React", "Node.js", "PouchDB", "PostgreSQL", "Mapbox", "D3.js"],
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800"
    ],
    featured: true,
    order: 2,
  },
  {
    title: "5G Network Optimization Engine",
    slug: "5g-network-optimization",
    description: "Machine learning-powered system for real-time 5G network optimization, predictive maintenance, and resource allocation.",
    challenge: "Process massive volume of network telemetry (1M+ events/minute), predict failures 24 hours in advance, optimize radio resource allocation across 100+ cell sites.",
    solution: "Implemented Python/ML pipeline with time-series forecasting (Prophet, LSTM), reinforcement learning for resource allocation, and real-time optimization engine. Stream processing with Kafka.",
    outcome: "Improved network availability to 99.95%. Reduced maintenance costs by 35%. Decreased network congestion by 28%. Processed 30B+ events monthly with sub-minute latency.",
    category: "Infrastructure",
    techStack: ["Python", "TensorFlow", "Kafka", "Spark", "PostgreSQL", "Kubernetes"],
    images: [
      "https://images.unsplash.com/photo-1518611505868-48510c2e2e38?w=800",
      "https://images.unsplash.com/photo-1551434678-e076c8e7f1d4?w=800"
    ],
    featured: true,
    order: 3,
  },
  {
    title: "LoRaWAN Hardware Reference Design",
    slug: "lorawan-hardware-design",
    description: "Production-ready LoRaWAN end-device reference design with ultra-low power consumption and extended range capabilities.",
    challenge: "Design a multiplatform IoT device achieving >10 year battery life on AA batteries while supporting multiple sensors and over 25km range in open terrain.",
    solution: "Custom PCB design with SX1276 radio, STM32L0 MCU, and optimized power management. Implemented dynamic spreading factor adjustment, sleep mode orchestration, and flash-based configuration.",
    outcome: "Validated design across 5000+ field deployments. Average battery life: 12 years. Max range achieved: 28km. Cost: $35/unit in volume. Successfully licensed to 3 manufacturers.",
    category: "Hardware Engineering",
    techStack: ["ARM Cortex-M0", "LoRaWAN", "C/C++", "KiCad", "RF Design"],
    liveUrl: "https://github.com/projects/lorawan-hardware",
    featured: false,
    order: 4,
  },
];
