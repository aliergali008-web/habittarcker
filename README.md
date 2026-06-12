# StudyTracker

A performance tracker for students preparing for high-stakes exams. It watches
daily inputs (sleep, mood, energy) and study outputs (session length, focus),
connects the dots, and suggests a realistic day — lighter when you're running
on empty, harder when you're firing.

**Principles (non-negotiable):**

- **Zero guilt** — missed days are silence, not red warnings. Consistency is
  density ("18 of the last 30 days"), never a fragile streak.
- **Zero friction** — evening log is one messy sentence; morning check-in is
  two taps; the timer just runs.
- **Honesty over magic** — the insight engine asks questions
  ("your focus after short nights averages 2.1 — notice anything?"),
  never delivers verdicts. The student is the judge.
- **Adapts to reality** — the daily plan follows actual energy and exam
  proximity, not a rigid calendar.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
```

Mobile-first React + TypeScript + Vite. All data stays on-device in
localStorage (exportable as JSON from the Insights screen). The brain-dump
parser is a local heuristic for v1; an LLM can replace it later behind the
same interface.

## Shipping to the App Store (iOS)

The project is wired for [Capacitor](https://capacitorjs.com). Building an
`.ipa` requires a Mac with Xcode and an
[Apple Developer Program](https://developer.apple.com/programs/) membership
($99/year) — Apple does not allow iOS builds from Linux/Windows.

On a Mac:

```bash
npm install
npm run build
npx cap add ios          # one-time: generates the ios/ Xcode project
npx cap sync             # after every web build
npx cap open ios         # opens Xcode
```

Then in Xcode:

1. Select the **App** target → *Signing & Capabilities* → choose your team.
2. Set a unique bundle ID if needed (currently `com.studytracker.app` in
   `capacitor.config.ts`).
3. *Product → Archive*, then *Distribute App → App Store Connect*.
4. Create the app listing in [App Store Connect](https://appstoreconnect.apple.com),
   upload screenshots, fill in the privacy questionnaire (the app stores all
   data on-device and collects nothing), and submit for review.

For quick testing on your own iPhone without the App Store, the same Xcode
project runs on a connected device with a free Apple ID (7-day signing).
