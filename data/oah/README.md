# OAH data snapshots

Retrieved 2026-09-22/23 from the backend that serves the public OneAquaHealth Resilience Map (https://apps.oneaquahealth.eu/resmap/). The data is © the OneAquaHealth project (EU Horizon Europe). It is used here for a non-commercial hackathon prototype, with attribution.

The endpoint is undocumented. The prototype uses **only these snapshots, never the live API**. Permission to use it live has not yet been requested from the organizers (pending).

| File | Source endpoint | Content |
|---|---|---|
| sites.snapshot.json | /api/sites/all | 106 research sites (code, name, city, lat/lon) |
| health-risks.snapshot.json | /api/resilience-map/health-risks | 96 site-level lab health-risk scores (pathogen, fecal, ARG), one campaign per site |
| urban-parameters.snapshot.json | /api/resilience-map/urban-parameters | 104 sites, map-derived context (distances, % impervious/urban/vegetation) |
