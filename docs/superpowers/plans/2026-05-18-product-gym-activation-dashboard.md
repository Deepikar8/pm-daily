# Product Gym Activation Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a compact PostHog dashboard named `Product Gym: Activation Health` for the `daily-product-gym` project.

**Architecture:** Use PostHog's dashboard and insight tools directly. Verify event taxonomy and query shape before saving insights, then attach all saved insights to one pinned dashboard.

**Tech Stack:** PostHog MCP tools: `read-data-schema`, `query-trends`, `query-funnel`, `dashboard-create`, `insight-create`, `dashboard-get`.

---

## Files

- Read: `docs/superpowers/specs/2026-05-18-product-gym-activation-dashboard-design.md`
- Create/modify in PostHog: dashboard `Product Gym: Activation Health`
- No application files are modified by this plan.

## Task 1: Confirm PostHog Taxonomy

**Files:**
- Read: `docs/superpowers/specs/2026-05-18-product-gym-activation-dashboard-design.md`

- [ ] **Step 1: Confirm available events**

Run:

```text
posthog:exec({ "command": "call read-data-schema {\"query\":{\"kind\":\"events\",\"limit\":500}}" })
```

Expected: response includes `page_view`, `landing_question_submit`, `today_start`, and `result_share`.

- [ ] **Step 2: Confirm share method property values**

Run:

```text
posthog:exec({ "command": "call read-data-schema {\"query\":{\"kind\":\"event_property_values\",\"event_name\":\"result_share\",\"property_name\":\"method\"}}" })
```

Expected: response includes `linkedin`, `whatsapp`, `clipboard`, and `native`.

- [ ] **Step 3: Confirm Today CTA source property values**

Run:

```text
posthog:exec({ "command": "call read-data-schema {\"query\":{\"kind\":\"event_property_values\",\"event_name\":\"today_start\",\"property_name\":\"source\"}}" })
```

Expected: response includes `today_top_cta` and `today_bottom_cta`.

## Task 2: Create Dashboard

**Files:**
- Create in PostHog: dashboard `Product Gym: Activation Health`

- [ ] **Step 1: Create pinned dashboard**

Run:

```text
posthog:exec({ "command": "call dashboard-create {\"name\":\"Product Gym: Activation Health\",\"description\":\"Compact launch-health dashboard for Product Gym activation. Tracks visitor volume, landing answer activity, Today challenge starts, and result sharing using the current PostHog event taxonomy.\",\"pinned\":true,\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"delete_insights\":false}" })
```

Expected: response returns a numeric dashboard `id`.

- [ ] **Step 2: Save dashboard ID**

Record the dashboard `id` from Step 1. Use it as `<dashboard_id>` in all insight creation calls below.

## Task 3: Create KPI Insights

**Files:**
- Create in PostHog: four saved insights attached to `<dashboard_id>`

- [ ] **Step 1: Query visitors KPI**

Run:

```text
posthog:exec({ "command": "call query-trends {\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"page_view\",\"name\":\"Visitors\",\"math\":\"dau\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}" })
```

Expected: query succeeds and returns a single bold-number-style result.

- [ ] **Step 2: Save visitors KPI**

Run:

```text
posthog:exec({ "command": "call insight-create {\"name\":\"Visitors\",\"description\":\"Unique users who triggered page_view in the last 30 days.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"page_view\",\"name\":\"Visitors\",\"math\":\"dau\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}}}" })
```

Expected: response returns a saved insight.

- [ ] **Step 3: Query and save landing answers KPI**

Run:

```text
posthog:exec({ "command": "call query-trends {\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"landing_question_submit\",\"name\":\"Landing Answers\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}" })
posthog:exec({ "command": "call insight-create {\"name\":\"Landing Answers\",\"description\":\"Landing page first-question submissions in the last 30 days.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"landing_question_submit\",\"name\":\"Landing Answers\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}}}" })
```

Expected: query succeeds and saved insight is attached to `<dashboard_id>`.

- [ ] **Step 4: Query and save Today starts KPI**

Run:

```text
posthog:exec({ "command": "call query-trends {\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Starts\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}" })
posthog:exec({ "command": "call insight-create {\"name\":\"Today Starts\",\"description\":\"Clicks from Today page into the quiz in the last 30 days.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Starts\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}}}" })
```

Expected: query succeeds and saved insight is attached to `<dashboard_id>`.

- [ ] **Step 5: Query and save result shares KPI**

Run:

```text
posthog:exec({ "command": "call query-trends {\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Shares\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}" })
posthog:exec({ "command": "call insight-create {\"name\":\"Result Shares\",\"description\":\"Result-share actions in the last 30 days.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Shares\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"BoldNumber\"}}}}" })
```

Expected: query succeeds and saved insight is attached to `<dashboard_id>`.

## Task 4: Create Funnel Insight

**Files:**
- Create in PostHog: saved funnel insight attached to `<dashboard_id>`

- [ ] **Step 1: Query activation funnel**

Run:

```text
posthog:exec({ "command": "call query-funnel {\"kind\":\"FunnelsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"page_view\",\"name\":\"Visit\"},{\"kind\":\"EventsNode\",\"event\":\"landing_question_submit\",\"name\":\"Landing Answer\"},{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Start\"},{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Share\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"funnelsFilter\":{\"funnelOrderType\":\"ordered\",\"funnelVizType\":\"steps\",\"funnelWindowInterval\":14,\"funnelWindowIntervalUnit\":\"day\",\"layout\":\"vertical\"}}" })
```

Expected: query succeeds and returns funnel conversion/drop-off data.

- [ ] **Step 2: Save activation funnel**

Run:

```text
posthog:exec({ "command": "call insight-create {\"name\":\"Activation funnel: visit to share\",\"description\":\"Ordered activation funnel from page view to landing answer, Today start, and result share.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"FunnelsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"page_view\",\"name\":\"Visit\"},{\"kind\":\"EventsNode\",\"event\":\"landing_question_submit\",\"name\":\"Landing Answer\"},{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Start\"},{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Share\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"funnelsFilter\":{\"funnelOrderType\":\"ordered\",\"funnelVizType\":\"steps\",\"funnelWindowInterval\":14,\"funnelWindowIntervalUnit\":\"day\",\"layout\":\"vertical\"}}}}" })
```

Expected: saved funnel insight is attached to `<dashboard_id>`.

## Task 5: Create Supporting Insights

**Files:**
- Create in PostHog: three saved insights attached to `<dashboard_id>`

- [ ] **Step 1: Query and save daily activation trend**

Run:

```text
posthog:exec({ "command": "call query-trends {\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"page_view\",\"name\":\"Page Views\",\"math\":\"total\"},{\"kind\":\"EventsNode\",\"event\":\"landing_question_submit\",\"name\":\"Landing Answers\",\"math\":\"total\"},{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Starts\",\"math\":\"total\"},{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Shares\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"ActionsLineGraph\",\"showLegend\":true}}" })
posthog:exec({ "command": "call insight-create {\"name\":\"Activation events by day\",\"description\":\"Daily trend for page views, landing answers, Today starts, and result shares.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"page_view\",\"name\":\"Page Views\",\"math\":\"total\"},{\"kind\":\"EventsNode\",\"event\":\"landing_question_submit\",\"name\":\"Landing Answers\",\"math\":\"total\"},{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Starts\",\"math\":\"total\"},{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Shares\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"trendsFilter\":{\"display\":\"ActionsLineGraph\",\"showLegend\":true}}}}" })
```

Expected: query succeeds and saved insight is attached to `<dashboard_id>`.

- [ ] **Step 2: Query and save share method mix**

Run:

```text
posthog:exec({ "command": "call query-trends {\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Shares\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"breakdownFilter\":{\"breakdowns\":[{\"property\":\"method\",\"type\":\"event\"}],\"breakdown_limit\":10},\"trendsFilter\":{\"display\":\"ActionsBarValue\",\"showLegend\":true}}" })
posthog:exec({ "command": "call insight-create {\"name\":\"Share method mix\",\"description\":\"Result-share actions broken down by share method.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"result_share\",\"name\":\"Result Shares\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"breakdownFilter\":{\"breakdowns\":[{\"property\":\"method\",\"type\":\"event\"}],\"breakdown_limit\":10},\"trendsFilter\":{\"display\":\"ActionsBarValue\",\"showLegend\":true}}}}" })
```

Expected: query succeeds and saved insight is attached to `<dashboard_id>`.

- [ ] **Step 3: Query and save Today CTA source mix**

Run:

```text
posthog:exec({ "command": "call query-trends {\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Starts\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"breakdownFilter\":{\"breakdowns\":[{\"property\":\"source\",\"type\":\"event\"}],\"breakdown_limit\":10},\"trendsFilter\":{\"display\":\"ActionsBarValue\",\"showLegend\":true}}" })
posthog:exec({ "command": "call insight-create {\"name\":\"Today start source mix\",\"description\":\"Today challenge starts broken down by CTA source.\",\"dashboards\":[<dashboard_id>],\"tags\":[\"product-gym\",\"activation\",\"launch\"],\"query\":{\"kind\":\"InsightVizNode\",\"source\":{\"kind\":\"TrendsQuery\",\"series\":[{\"kind\":\"EventsNode\",\"event\":\"today_start\",\"name\":\"Today Starts\",\"math\":\"total\"}],\"dateRange\":{\"date_from\":\"-30d\"},\"interval\":\"day\",\"breakdownFilter\":{\"breakdowns\":[{\"property\":\"source\",\"type\":\"event\"}],\"breakdown_limit\":10},\"trendsFilter\":{\"display\":\"ActionsBarValue\",\"showLegend\":true}}}}" })
```

Expected: query succeeds and saved insight is attached to `<dashboard_id>`.

## Task 6: Verify Dashboard

**Files:**
- Verify in PostHog: dashboard `Product Gym: Activation Health`

- [ ] **Step 1: Retrieve dashboard**

Run:

```text
posthog:exec({ "command": "call dashboard-get {\"id\":<dashboard_id>}" })
```

Expected: response includes the dashboard name and eight attached insights:

- `Visitors`
- `Landing Answers`
- `Today Starts`
- `Result Shares`
- `Activation funnel: visit to share`
- `Activation events by day`
- `Share method mix`
- `Today start source mix`

- [ ] **Step 2: Report dashboard path**

Report:

```text
/dashboard/<dashboard_id>
```

Include the known instrumentation gap: the dashboard measures entry into the Product Gym loop and sharing, but does not measure full quiz completion until a completion event is added.
