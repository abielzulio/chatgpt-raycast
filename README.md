# Unofficial ChatGPT Raycast extension

---

> Run ChatGPT through Raycast extension, powered by [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)

> **Warning**
> This extension was made intentionally to be running on dev environment only. Will submit if there's an official API.


https://user-images.githubusercontent.com/7030944/205975673-665168f4-c290-4f3d-9ffb-1c5cf87e010f.mp4


## Features
- Ask question through full text input or [search bar input](https://github.com/abielzulio/chatgpt-raycast/commit/e53e3d6284917729064f52583e8a1a39ff1c3176)
- Save and search your saved generated answer
- Copy answer, question, question ID, and conversational ID directly with a hotkey
- List view as UI for better conversation flow [[@timolins](https://github.com/abielzulio/chatgpt-raycast/commit/e53e3d6284917729064f52583e8a1a39ff1c3176)]
- Share question and generated answer with [shareg.pt](https://shareg.pt) [[@timolins](https://github.com/abielzulio/chatgpt-raycast/commit/e53e3d6284917729064f52583e8a1a39ff1c3176)]
- Use native preferences to store the Session token [[@timolins](https://github.com/abielzulio/chatgpt-raycast/commit/e53e3d6284917729064f52583e8a1a39ff1c3176)]


## How to use

This package requires a valid session token from ChatGPT to access it's unofficial REST API by [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api). 

To get a session token:
1. Go to https://chat.openai.com/chat and log in or sign up.
2. Open dev tools.
3. Open `Application` > `Cookies`.

   ![ChatGPT cookies](https://github.com/transitive-bullshit/chatgpt-api/blob/main/media/session-token.png?raw=true)
   
4. Copy the value for `__Secure-next-auth.session-token` and paste in the initialization set-up!

> Session token will be stored locally using [Preferences API](https://developers.raycast.com/api-reference/preferences)

## Install

```bash
npm install
npm run dev
```
