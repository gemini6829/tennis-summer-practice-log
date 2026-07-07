# Summer Practice Log 2026

A practice hour tracking tool for a tennis team. Members log daily sessions and can view their weekly stats and team ranking. The coach manages the roster and views all data in a shared Google Sheet.

## Versions

### Web (`web/`)
A single-page website built with vanilla HTML, CSS, and JavaScript. Accessible to all team members through a shared link with no installation required.

**Live site:** [your Netlify URL here]

### App (`app/`)
An iOS mobile app built with React Native and Expo. Mirrors the web version with a native mobile experience.

## Backend (`google-apps-script/`)
Both versions share the same backend: a Google Apps Script web app that reads and writes to a Google Sheet. The sheet has three tabs:

- **Users** — roster of member names, managed by the coach
- **Practice Logs** — member × date grid of logged sessions
- **Stats** — member × week grid of total hours, rebuilt hourly

## Features
- Name-only login (coach adds members directly to the sheet)
- Log multiple practice types per day: Private Lesson, Group Lesson, Fitness Training, Tournament, Hitting, Other, School Practice, Out of Town, Sick, Bad Weather, Rest Day
- Duplicate detection with option to override
- Analysis page with weekly hours, team percentile ranking, and 30-day chart

## Setup
See `SETUP_GUIDE.md` for step-by-step deployment instructions.
