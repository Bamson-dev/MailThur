# MailThur OAuth Verification Demo Video

Professional Remotion project demonstrating how MailThur uses `gmail.send` and `gmail.readonly` for Google OAuth verification.

## Specs

- **Resolution:** 1920×1080
- **Frame rate:** 30 fps
- **Duration:** ~2 minutes 8 seconds (8 scenes with 1s title cards)
- **Output:** MP4 (H.264)

## Setup

```bash
cd remotion-demo
npm install
```

## Preview (Studio)

```bash
npm run preview
```

Open Remotion Studio and scrub through all 8 scenes to verify animations before rendering.

## Render to Downloads

```bash
npm run render:downloads
```

This writes:

```
/Users/donbamz/Downloads/MailThur-Demo.mp4
```

## Render to project root

```bash
npm run render
```

## Scenes

1. Introduction
2. User arrives at mailthur.com
3. Dashboard and Connect Gmail
4. Google OAuth Consent Screen
5. Inbox Connected Successfully
6. Creating a Campaign and Sending Emails
7. Reply Detection
8. Summary and Closing

## Brand colors

| Token | Value |
|-------|-------|
| Background | `#0D0F1A` |
| Purple accent | `#7C3AED` |
| Text | `#FFFFFF` |
| Muted | `#6B7280` |
| Card | `#131625` |
| Border | `#1E2235` |

Font: **Inter** (Google Fonts via `@remotion/google-fonts`)
