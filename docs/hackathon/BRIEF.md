# Event Brief — OneAquaHealth IEEE Global Hackathon 2026

Checked: 2026-09-22 (~22:10 SGT) via direct fetch of the official Devpost pages (browser UA; plain curl gets 403).
Entrant: solo (user is in Singapore, UTC+8).

## Sources (official)
- Overview: https://oneaquahealth-ieee-hackathon.devpost.com/
- Rules: https://oneaquahealth-ieee-hackathon.devpost.com/rules
- Schedule: https://oneaquahealth-ieee-hackathon.devpost.com/details/dates
- Updates: https://oneaquahealth-ieee-hackathon.devpost.com/updates (esp. #46406 "starts tomorrow", #46511 "review recordings")
- Forum: https://oneaquahealth-ieee-hackathon.devpost.com/forum_topics (manager = Pradyumna Kodgi)
- Session recordings: https://www.oneaquahealth.eu/project-events/
- Project: https://www.oneaquahealth.eu/ ; Citizen Science App: https://apps.oneaquahealth.eu/login
- Contact: oneaquahealth@ieee.org ; Slack invite posted by manager in forum topic 45266

## Status & deadlines — CONFIRMED
| Item | Value | Source |
|---|---|---|
| Submission window | Sep 14 09:00 PDT → **Sep 30 21:00 PDT** | /details/dates |
| Deadline in Singapore | **Thu Oct 1, 12:00 noon SGT** (= Oct 1 04:00 UTC) | computed |
| Judging | Oct 1 – Oct 15, 2026 | /details/dates, /rules |
| Winners announced | Oct 24, 2026, at IEEE IGET conference (S. California) | /rules, update #46492 |
| Status | **Active** (build period running) | — |
| Format | Online, public | overview |

Note: overview sidebar also says "October 01 at 12:00am EDT to deadline" — a Devpost display glitch; the schedule page is authoritative. No extension should be assumed.

## Eligibility — CONFIRMED with CONFLICTS
- Rules: legal age of majority in country of residence; "Open to individuals or teams"; each person on one team; must register on Devpost before the deadline; organizers/judges excluded.
- **Conflict 1 (student / team):** Devpost sidebar says "Students only", "Team required", "Companies/professional organizations excluded". Rules page says "Open to individuals or teams" and does not require student status; update #46492 invites "professionals" too. Interpretation: solo is allowed per the rules; being a student satisfies the stricter reading anyway. Devpost lets a solo entrant submit as a team of one.
- **Conflict 2 (registration close):** Rules say registration closed Aug 31. Overview says "Registration Still Open"; manager replied on forum (Sep 15 and Sep 20) "register open and you can submit your project before 30th September." → Late registration is accepted (CONFIRMED by organizer).
- Age of majority: Singapore = 21 for contracts (INFERENCE; affects entrants under 21 — an open forum question from an Egyptian 19-year-old is unanswered).
- "Projects must be original and developed during the hackathon period" → all code must be new, written from Sep 14 onward.

## Tracks (choose one) — CONFIRMED (overview table)
1. Citizen Science UX — guided workflows, simplified ecological terms, data accuracy, repeat engagement.
2. Data-to-Insight — dashboards, maps, trend analysis, One Health insight summaries.
3. AI-Supported Assessment — AI prompts, validation checks, explainable AI, human-in-the-loop ("without replacing human judgment").
4. Awareness & Storytelling — educational modules, storytelling, personalized insights.
5. Community & Gamification — gamification, challenges, social features.
6. Resilience Informatics — predictive dashboards, alerts, resilience tools.
7. Digital Health Standards — FHIR models, AI agents, integration frameworks.
Tagline: "From streams to systems: turning citizen science into actionable One Health intelligence."

## Prizes — CONFIRMED with CONFLICT
Devpost prize list (authoritative for amounts): Winner $1,500; Runner-up $1,000; Third $500; Special Mention $250 ×2 ("didn't finish in top 3 but very close"); IEEE Certificate of Merit (top 3); Certificate of Participation (all eligible); IEEE Senior Member nomination (eligible IEEE-member winners).
Rules page: "5000$ Cash/InKind Prize TBD"; ties → both get higher prize; cash subject to IEEE disbursement rules; top 3 may get 1-yr IEEE Basic Membership. Update of Aug says "$3,000+". → Treat **$3,500 cash** as the working figure. No sponsor/track-specific prizes; **all tracks compete for the same overall ranking.**

## Judging — CONFIRMED (rules page, weights published)
| Criterion | Weight | Description |
|---|---|---|
| Impact & Alignment with OneAquaHealth mission | **30%** | improves monitoring, protection, awareness or sustainability of water ecosystems + link to human/animal/environmental health |
| Innovation & Creativity | 20% | originality, creative use of tech for ecosystem & citizen-science challenges |
| Technical Implementation / Architecture | 20% | prototype quality, architecture, functionality, effective use of tools, APIs, data sources |
| Usability & UX | 15% | ease of use, clarity, accessibility for intended users |
| Feasibility & Scalability | 15% | real-world implementation, scalability, **integration with existing systems** |
Each scored 1–10, weighted sum; tie → judges consider impact and innovation.
Organizer emphasis (update #46511): clear problem; alignment with OneAquaHealth; innovation & practical value; "effective use of data, technology, AI, APIs, standards"; clear demonstration of what was built. Update #46406: "demonstrate what you built rather than only describing an idea."

## Judges (10) — CONFIRMED names/roles
Maria João Feio (OneAquaHealth coordinator; freshwater ecologist), Alexander Nikolov (SYNYO), Pradyumna Kodgi (Oracle; IEEE EMBS OC; hackathon manager), Gora Datta (HL7 FHIR fellow "FHL7"), David E. González (IEEE Blockchain), Vinay Sharma (Persistent Systems), Sreekanth Reddy Panyam (IEEE SM), George Koutalieris (ENORA Innovation), Harm op den Akker & Ângela Freitas (SHINE 2Europe).
INFERENCE: panel mixes ecology domain experts, EU project partners, and digital-health-standards people (Session 4 was HL7 FHIR + OAH-FHIR IG + sandbox, featuring Nikolov, Datta, Kodgi).

## Deliverables — CONFIRMED
- Track alignment statement
- Project description (problem, solution, target users, expected impact on ecosystem & human health)
- Demo video **3–5 minutes**
- **Public** code repository with source code and documentation
- Working prototype, mockup, or proof-of-concept (working preferred per updates)
UNKNOWN: video host requirements (Devpost typically YouTube/Vimeo), whether live deployment is required (not stated), Devpost custom submission fields (visible only when starting a submission).

## Technology — CONFIRMED
No mandatory technology. Encouraged: AI, data platforms, digital health standards (HL7 FHIR, OAH-FHIR IG), OneAquaHealth Hub tools (Citizen Science App, City Dashboards, Resilience Map, GEOSSIP). No rule restricts AI coding assistants (checked rules page; none mentioned).

## Resources / support — CONFIRMED
Mentors on request via oneaquahealth@ieee.org (forum 45292). Slack workspace (forum 45266). Six recorded sessions (see project-events page).

## UNKNOWN
- Whether judges run the prototype or rely on the video (INFERENCE: mostly video + repo, with 10 judges × many entries).
- Number of submissions expected (976 registered participants as of Sep 22).
- Exact OAH-FHIR IG content and sandbox availability → see research_oah_ecosystem notes.
