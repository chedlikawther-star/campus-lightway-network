# Campus Lightway Network

Build a modern, mobile-friendly web app prototype called "SafeRoute" exclusively for female students' safety. Use a clean, trustworthy purple and white UI. Include 3 main tabs/features:

1. "Safe Map": An interactive Leaflet/OpenStreetMap view showing two route options between a University and a Residential Area: "Route A: Fastest (10 mins - 60% Safe)" in orange and "Route B: Safest (12 mins - 95% Safe)" in green, with safety breakdown badges (Street Lighting, Crowd Density, Community Reports) and a button to submit a quick danger report. Include a placeholder service/function analyzeSafetyWithGemini(routeData) with clear comments where my teammate can plug in his Gemini API key later.

2. "Commute Buddies": A student ID verification screen (mock OCR upload button that shows a "Verified Student" badge once clicked) and a list of verified female students nearby going to the same university with a "Request Buddy" button.

3. "Silent SOS": A voice-activated emergency feature using the browser's Web Speech API. Let the user set a secret phrase (default: "It's really cold today"), toggle listening mode, and trigger a simulated silent alert showing live GPS coordinates, audio recording status, and emergency contacts notified.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://campus-lightway-network.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1ec20f77-0cdd-4dcb-b8b4-37adfb66bec0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
