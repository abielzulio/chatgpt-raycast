# Unofficial ChatGPT Raycast extension

> Run ChatGPT through Raycast extension, powered by [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)

> **Warning**
> This extension was made intentionally to be running on dev environment only. Will submit if there's an official API.

https://user-images.githubusercontent.com/7030944/205639775-e0bb5a43-b014-449b-8f7c-d126bd6bf786.mp4

## How it works

> **Note**
> Modified from [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)

This package requires a valid session token from ChatGPT to access it's unofficial REST API.

To get a session token:
1. Go to https://chat.openai.com/chat and log in or sign up.
2. Open dev tools.
3. Open `Application` > `Cookies`.

   ![ChatGPT cookies](https://github.com/transitive-bullshit/chatgpt-api/blob/main/media/session-token.png?raw=true)
   
4. Copy the value for `__Secure-next-auth.session-token` and save it for later.

## How to use

1. For the first time only, you need to input your __session token__ in the session token field. Otherwise, it'll give you an invalid session token error.
> Session token will be stored using [Cache API](https://developers.raycast.com/api-reference/cache)

https://user-images.githubusercontent.com/7030944/205637433-65adb34f-2120-48b6-97cc-4a935371c1c3.mp4


2. Type your __question__ in the question field and then you're good to go!


## Install

```bash
npm install
npm run dev
```
