// Rich seed data for blog and portfolio
export const seedBlogPosts = [
  {
    title: "LoRaWAN in IoT: Deep Technical Analysis",
    slug: "lorawan-iot-deep-dive",
    excerpt: "Comprehensive exploration of LoRaWAN protocol architecture, performance optimization, and real-world deployment strategies.",
    content: `# LoRaWAN in IoT: Deep Technical Analysis

## Introduction
LoRaWAN represents a paradigm shift in long-range, low-power wireless communication for the Internet of Things. This deep dive explores the technical architecture, implementation strategies, and optimization techniques.

## Protocol Architecture

### Physical Layer (PHY)
- Frequency Bands: 868 MHz (EU), 915 MHz (US), regional variations
- Bandwidth: 125 kHz, 250 kHz, 500 kHz (FSK mode)
- Spreading Factor: SF7-SF12 (Range vs Data Rate trade-off)
- Coding Rate: 4/5, 4/6, 4/7, 4/8

### Data Rate Calculation
\`\`\`
DR = SF * BW / 2^SF
\`\`\`

## Hardware Engineering Considerations

### Transceiver Selection
- **SX1272/73**: Low cost, proven in production
- **SX1276/77/78**: Enhanced performance, better sensitivity
- **LR1110**: Integrated GNSS, low power

### Power Budget Analysis
- Transmit Power: 2-20 dBm
- Receiver Sensitivity: -137 to -130 dBm (depending on SF)
- Minimum Power Loss: Path Loss < Transmit Power - Sensitivity + Margin

### Antenna Design
- Omni-directional for general coverage
- Directional arrays for targeted deployment
- Impedance matching critical for efficiency

## Real-World Deployment Patterns

### Gateway Architecture
- Multi-channel simultaneous reception
- Backhaul options: WiFi, Ethernet, Cellular
- Processing strategy: Local filtering vs Cloud processing

### Network Optimization
- Adaptive Data Rate (ADR) implementation
- Duty cycle compliance (Sub-band limitations)
- Link budget calculation and margin planning

## Advanced Topics

### Encryption & Security
- Network Session Key (NwkSKey)
- Application Session Key (AppSKey)
- Join Procedure (OTAA vs ABP)

### Interference Management
- Collision avoidance through random backoff
- Capture effect and Friis formula
- Co-channel interference mitigation

## Performance Benchmarks

| Spreading Factor | Range (ideal) | Data Rate | Airtime (bytes) |
|---|---|---|---|
| SF7 | 2-5 km | 5.47 kbps | 41 ms |
| SF9 | 5-10 km | 1.37 kbps | 163 ms |
| SF12 | 10-15 km | 0.29 kbps | 1,648 ms |

## Conclusion
Successful LoRaWAN deployments require deep understanding of the protocol stack, careful hardware selection, and rigorous network design.`,
    category: "Hardware Engineering",
    tags: ["IoT", "LoRaWAN", "Networking", "Hardware", "RF Design"],
    readTimeMinutes: 12,
  },
  {
    title: "MEL Systems: Monitoring Framework Deep Dive",
    slug: "mel-monitoring-framework",
    excerpt: "Advanced methodological insights into designing, implementing, and validating comprehensive Monitoring, Evaluation, and Learning systems.",
    content: `# MEL Systems: Monitoring Framework Deep Dive

## Core MEL Principles

### Monitoring
- **Definition**: Ongoing systematic collection and analysis of data
- **Frequency**: Real-time, daily, weekly, monthly depending on indicators
- **Data Quality**: Validation rules, error checking, source verification

### Evaluation
- **Formative**: Ongoing process improvement (Baseline → Midline → Endline)
- **Summative**: Impact assessment and outcome validation
- **Counterfactual**: Understanding what would have happened without intervention

### Learning
- **Knowledge Management**: Documenting insights and lessons learned
- **Adaptive Management**: Using data to adjust strategies in real-time
- **Knowledge Sharing**: Communicating findings to stakeholders

## Data Flow Architecture

\`\`\`
Indicators Definition
    ↓
Data Collection (Primary/Secondary)
    ↓
Data Validation & Cleaning
    ↓
Analysis & Interpretation
    ↓
Reporting & Visualization
    ↓
Learning & Decision-Making
    ↓
Program Adjustment
\`\`\`

## Indicator Design Framework

### SMART Criteria
- **Specific**: Clear, unambiguous definition
- **Measurable**: Quantifiable or observable
- **Achievable**: Realistic within context
- **Relevant**: Directly tied to objectives
- **Time-bound**: Collection schedule defined

### Indicator Hierarchy
1. Impact Indicators (Long-term, 3-5 years)
2. Outcome Indicators (Medium-term, 1-2 years)
3. Output Indicators (Short-term, 6-12 months)
4. Process Indicators (Operational, monthly)

## Data Management Systems

### Collection Methods
- Direct surveys and interviews
- Administrative data extraction
- Remote sensing and GIS integration
- Mobile data collection (ODK, KoboToolbox)

### Quality Assurance
- Field verification protocols
- Double entry verification
- Outlier detection and investigation
- Completeness and timeliness checks

## Analysis Techniques

### Quantitative Methods
- Descriptive statistics and trend analysis
- Regression analysis for causal relationships
- Randomized control trials (RCT) for impact
- Difference-in-differences estimation

### Qualitative Methods
- Thematic coding and content analysis
- Most Significant Change (MSC)
- Participatory evaluation methods
- Case study documentation

## Visualization & Reporting

### Dashboard Components
- Real-time indicator tracking
- Trend visualization
- Drill-down capabilities
- Comparative analysis views

### Report Structures
- Executive Summary (1-2 pages)
- Key Findings (with visualizations)
- Methodology Appendix
- Recommendations & Learning Insights

## Challenges & Solutions

| Challenge | Solution |
|---|---|
| Data Collection Gaps | Sampling strategy, imputation methods |
| Indicator Manipulation | Third-party verification, audits |
| Feedback Loop Delays | Real-time dashboards, rapid turnaround |
| Stakeholder Disengagement | Regular feedback sessions, participatory analysis |

## Conclusion
Robust MEL systems transform data into actionable insights, enabling evidence-based decision-making and continuous improvement.`,
    category: "MEL Systems",
    tags: ["MEL", "Monitoring", "Evaluation", "Learning", "Data Analytics"],
    readTimeMinutes: 14,
  },
];

export const seedPortfolioProjects = [
  {
    title: "ICT Infrastructure: Enterprise Network Design",
    slug: "enterprise-network-design",
    description: "Complete network infrastructure redesign for multi-site organization",
    challenge: "Legacy systems struggling with scalability, security vulnerabilities, inadequate disaster recovery",
    solution: "Implemented modern network stack: Core switches (Cisco Nexus), access layer virtualization, software-defined networking, automated configuration management",
    outcome: "99.9% uptime, 40% cost reduction, secure segmentation, automated provisioning",
    category: "ICT Infrastructure",
    techStack: ["Cisco Nexus", "F5 LTM", "Ansible", "Python", "VMware", "Active Directory"],
    featured: true,
  },
  {
    title: "MEL Systems: Data Warehouse Implementation",
    slug: "mel-data-warehouse",
    description: "Enterprise data platform for monitoring and evaluation",
    challenge: "Data siloed across systems, slow reporting cycles, difficulty analyzing program effectiveness",
    solution: "Built scalable data warehouse: ETL pipelines, star schema design, real-time dashboards, automated validation",
    outcome: "50% faster reporting, 99.5% data accuracy, self-service analytics for program managers",
    category: "MEL Systems",
    techStack: ["PostgreSQL", "Apache Airflow", "Tableau", "Python", "dbt", "Docker"],
    featured: true,
  },
  {
    title: "IoT Deployment: Smart Agriculture Network",
    slug: "smart-agriculture-iot",
    description: "LoRaWAN-based environmental monitoring for agricultural development",
    challenge: "Limited connectivity in rural areas, expensive cellular solutions, need for low-power sensors",
    solution: "20-gateway LoRaWAN network across 500 km², multi-parameter sensors (soil, weather, irrigation)",
    outcome: "45% crop yield increase, 30% water savings, real-time alerts for 2,000+ farmers",
    category: "Hardware Engineering",
    techStack: ["LoRaWAN", "Raspberry Pi", "Python", "Node-RED", "PostgreSQL", "Grafana"],
    featured: true,
  },
];
