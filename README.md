# Unofficial ChatGPT Raycast extension

> Run ChatGPT through Raycast extension, powered by [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)

> **Warning**
> This extension was made intentionally to be running on dev environment only. Will submit if there's an official API.

![](/preview.gif)

## How it works

> **Note**
> From [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)

It uses headless Chromium via [Playwright](https://playwright.dev) to automate the webapp, so **you still need to have access to ChatGPT**. It just makes building API-like integrations much easier.

Chromium will be opened in non-headless mode by default, which is important because the first time you run `ChatGPTAPI.init()`, you'll need to log in manually. We launch Chromium with a persistent context, however, so you shouldn't need to keep re-logging in after the first time.

When you log in the first time, we recommend dismissing the welcome modal so you can watch the progress. This isn't strictly necessary, but it helps to understand what's going on.

## Install

```bash
npm install
npm run dev
```
