---
title: Navibot Development Guide
description: A complete guide to authoring plugins using Navibot.
category: Navibot
order: "0"
version: 1.0.13
updated: 2026-05-23
image: ""
imageAlt: ""
hideCoverImage: false
draft: false
featured: true
---
# Navi Bot — Lua Plugin API Reference

Complete guide for writing Lua plugins for the Navi Bot engine. Covers every API function, every data structure, and the patterns used in the real plugins that ship with the bot.

---

## Sections

- [Getting Started](docs/navibot-getting-started/index.md) — How plugins work, plugin anatomy, load order, logging
- [Configuration](docs/navibot-configuration/index.md) — `register_config`, config types, lists, enums, reading values
- [Database](docs/navibot-database/index.md) — Key-value store, namespacing, get/set/query
- [Commands & Interactions](docs/navibot-commands-interactions/index.md) — Slash commands, message listeners, buttons, select menus, modals
- [Messaging & Discord API](docs/navibot-messaging/index.md) — Sending messages, embeds, member/role/channel management, bot status
- [Events & Timers](docs/navibot-events-timers/index.md) — Inter-plugin event bus, Discord event callbacks, timed intervals
- [Utilities](docs/navibot-utilities/index.md) — HTTP client, JSON, permissions
- [Reference](docs/navibot-reference/index.md) — Data types, common patterns, and pitfalls to avoid
