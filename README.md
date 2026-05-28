# Messenger Task

Welcome! This repository is the starting point for the recruitment test.

For your solution clone this repository and create a new branch with a name that clearly identifies you.
You can use as many branches locally as you want, but please make sure that you push only to your one branch.

## Rules

- Use TypeScript and Web technologies for the implementation.
- You may use any runtime/package manager you want, but we'll use bun for the evaluation.
- You may use the Copilot AI inside VS Code
  - if you do, please [export](https://code.visualstudio.com/docs/copilot/chat/chat-sessions#_save-and-export-chat-sessions) and include the chat session in your branch

## Task

As the name suggests your task is to implement a messaging app,
similar to th one you surely know like WhatsApp, Discord, Signal, etc.

The following features are required:

1. Messaging:
   - User can send and receive messages
   - User can send images
   - User can create group chats with multiple users
   - User can delete their own messages
   - User can edit their own messages
   - User can react to messages (likes, emojis - up to you)
   - User can reply to messages - the mentioning of exact previous message
   - Read receipts - the sender can see when their messages have been read
   - Multi-session consistency - if the same user has two tabs / devices open, a message sent or action taken in one should appear in the other (effectively) instantly
   - (nice to have) typing / online indicators
2. System:
   - the messenger should work offline [^1]
   - after going back online, the state should sync with the server
     - user gets the messages, that they missed while offline
     - messages and actions of the user sync to the server

[^1]: For testing offline behavior, you can use Chrome DevTools `Network > Throttling > Offline`.

## Submission

Please structure your branch so it contains:

- a `software/` folder with your implementation
- a `DECISIONS.md` documenting the choices you made and why
  (e.g. monolith vs separate client/server, storage, sync strategy, identity, ordering, deletion, ...)
- a `README.md` giving an overview of your implementation:
  how to run it, what's where, anything we should know before evaluating
