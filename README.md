# Kids Tutor

An interactive AI-powered educational tutor for students in Grades 1-5.

## Features
- **Personalized Learning**: Enter your name to get a warm welcome.
- **Subject Selection**: Choose from English, Math, Science, or take a fun Quiz.
- **AI Powered**: Uses Google's Gemini AI to generate grade-appropriate lessons and quizzes.
- **Kid-Friendly Design**: Bright colors, large buttons, and easy-to-read fonts.

## How to Deploy to GitHub Pages

The `gh-pages` branch will **not** appear in your GitHub settings until you run the deployment command from your computer. Follow these steps:

1.  **Open your terminal** in the project folder on your computer.
2.  **Install dependencies** (if you haven't already):
    ```bash
    npm install
    ```
3.  **Run the deploy command**:
    ```bash
    npm run deploy
    ```
    *This command will automatically build your app and create/update the `gh-pages` branch on GitHub.*

4.  **Wait a minute**, then go to your GitHub repository on the web.
5.  **Go to Settings > Pages**.
6.  Under **Build and deployment > Branch**, you should now see `gh-pages` in the dropdown. Select it and click **Save**.

## Troubleshooting
- **"gh-pages not found"**: This happens if you haven't run `npm run deploy` yet. The branch is created by the script.
- **White screen after deploy**: Ensure `vite.config.ts` has `base: './'`. (I have already added this for you).
- **API Key**: Remember to set your Gemini API Key in the app's **Settings** (Gear icon) after it's deployed.

## Configuration
The app requires a Gemini API Key. You can:
- Enter it on the landing page (stored in `sessionStorage`).
- Or set it as an environment variable `GEMINI_API_KEY` during development.

## License
Apache-2.0
