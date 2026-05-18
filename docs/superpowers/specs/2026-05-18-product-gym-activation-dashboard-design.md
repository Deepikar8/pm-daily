# Product Gym Activation Dashboard Design

## Context

Product Gym currently sends product analytics to PostHog when `PUBLIC_POSTHOG_KEY` is configured. The app captures a small launch-critical event set:

- `page_view`
- `landing_question_submit`
- `today_start`
- `result_share`

The active PostHog project is `daily-product-gym`. The goal is to add a compact activation dashboard that answers whether visitors are entering the Product Gym loop and whether any users reach the sharing loop.

## Dashboard

Name: `Product Gym: Activation Health`

Description: Compact launch-health dashboard for Product Gym activation. Tracks visitor volume, landing answer activity, Today challenge starts, and result sharing using the current PostHog event taxonomy.

Pinned: yes

Tags: `product-gym`, `activation`, `launch`

Default reporting window: last 30 days

## Metrics

### KPI Tiles

1. Visitors
   - Event: `page_view`
   - Aggregation: unique users
   - Visualization: bold number
   - Date range: last 30 days

2. Landing Answers
   - Event: `landing_question_submit`
   - Aggregation: total count
   - Visualization: bold number
   - Date range: last 30 days

3. Today Starts
   - Event: `today_start`
   - Aggregation: total count
   - Visualization: bold number
   - Date range: last 30 days

4. Result Shares
   - Event: `result_share`
   - Aggregation: total count
   - Visualization: bold number
   - Date range: last 30 days

### Primary Funnel

Insight name: `Activation funnel: visit to share`

Steps:

1. `page_view`
2. `landing_question_submit`
3. `today_start`
4. `result_share`

Configuration:

- Query type: funnel
- Funnel order: ordered
- Visualization: steps
- Conversion window: 14 days
- Date range: last 30 days

Purpose: show conversion and drop-off from first visit to landing answer, Today challenge start, and sharing.

### Daily Event Trend

Insight name: `Activation events by day`

Series:

- `page_view`, total count
- `landing_question_submit`, total count
- `today_start`, total count
- `result_share`, total count

Configuration:

- Query type: trends
- Visualization: line graph
- Interval: day
- Date range: last 30 days

Purpose: show whether activation behavior is growing, shrinking, or spiking by day.

### Share Method Mix

Insight name: `Share method mix`

Event: `result_share`

Breakdown:

- Property: `method`
- Type: event
- Known values observed in PostHog: `linkedin`, `whatsapp`, `clipboard`, `native`

Configuration:

- Query type: trends
- Aggregation: total count
- Visualization: bar value
- Date range: last 30 days

Purpose: show which sharing surfaces users choose.

### Today CTA Source Mix

Insight name: `Today start source mix`

Event: `today_start`

Breakdown:

- Property: `source`
- Type: event
- Known values observed in PostHog: `today_top_cta`, `today_bottom_cta`

Configuration:

- Query type: trends
- Aggregation: total count
- Visualization: bar value
- Date range: last 30 days

Purpose: show whether the top or bottom Today CTA is driving starts.

## Known Instrumentation Gap

The current PostHog taxonomy does not include full quiz completion, score, saved attempt, or signed-in save completion events. This dashboard must not label `today_start` as completion or claim to measure completed quizzes.

Future instrumentation should add separate events for:

- quiz started
- quiz completed
- result viewed
- attempt saved after sign-in
- score shared with score metadata

Once those events exist, the activation dashboard can replace the proxy `today_start` step with a real completion step and add a completion-rate insight.

## Creation Plan

1. Create the `Product Gym: Activation Health` dashboard in PostHog.
2. Query each insight shape before saving where supported by PostHog tools.
3. Save each insight to the new dashboard.
4. Retrieve the dashboard to verify that all expected tiles are attached.
5. Report the dashboard URL and note the completion instrumentation gap.

## Review Notes

This design is intentionally compact. It avoids acquisition and retention analysis except where a small supporting chart directly explains activation behavior. It also avoids creating misleading completion metrics before the app emits completion events.
