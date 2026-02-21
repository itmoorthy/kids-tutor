# Kids Tutor

An interactive AI-powered educational tutor for students in Grades 1-5.

## Features
- **Personalized Learning**: Enter your name to get a warm welcome.
- **Subject Selection**: Choose from English, Math, Science, or take a fun Quiz.
- **AI Powered**: Uses Google's Gemini AI to generate grade-appropriate lessons and quizzes.
- **Kid-Friendly Design**: Bright colors, large buttons, and easy-to-read fonts.

## How to Deploy to GitHub Pages

1. **Structure your repository**:
   - This project is built with React, TypeScript, and Vite.
   - Ensure your `package.json` has a `build` script: `"build": "tsc && vite build"`.
   - Ensure `vite.config.ts` has `base: './'` if you are deploying to a subfolder or just use the default for root domains.

2. **Build the project**:
   ```bash
   npm install
   npm run build
   ```

3. **Deploy the `dist` folder**:
   - You can use the `gh-pages` package:
     ```bash
     npm install gh-pages --save-dev
     ```
   - Add these scripts to `package.json`:
     ```json
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
     ```
   - Run `npm run deploy`.

4. **GitHub Settings**:
   - Go to your repository settings on GitHub.
   - Navigate to **Pages**.
   - Select the `gh-pages` branch as the source.

## Configuration
The app requires a Gemini API Key. You can:
- Enter it on the landing page (stored in `sessionStorage`).
- Or set it as an environment variable `GEMINI_API_KEY` during development.

## License
Apache-2.0
