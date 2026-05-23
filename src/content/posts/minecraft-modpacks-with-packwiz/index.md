---
title: Minecraft Modpacks with ✨ Packwiz ✨
published: 2026-05-23
updated: 2026-05-23
description: How to create/maintain a modpack with the Packwiz software
tags:
  - tutorial
  - minecraft
image: ""
imageAlt: ""
imageOG: true
hideCoverImage: false
hideTOC: false
hideLocalGraph: false
keyword: ""
draft: false
---

## Packwiz & Modpacks

I've been serving a Minecraft server for the better part of 3-4 years now. Over that time I've gleamed alot of things - one of them being that I don't like to host my modpacks on "traditional" sites like Curseforge or Modrinth (although I do like Modrinth **significantly** more!) and I've found self-hosting not only to be easier, but much, MUCH more efficent that going to your standard modpack hosts…you see, Packwiz is something special. It's a whole modpack management suite! Let's dive in 🏊‍♂

### Why Use Packwiz??

> "I like Curseforge" or "I like Modrinth" you might be saying

Well don't say that anymore. Because Packwiz gives you way more bang for your buck. Just a brief overview of features that Packwiz gives you as a modpack creator/maintainer:
- Easy installation of mods `packwiz modrinth add <whatever-mod>`
- One-line updating of all mod in a pack `packwiz update`
- Able to add mods from both Modrinth as well as Curseforge
- Quickly generate a list of all mods in your server `packwiz list`
- Allows developers to specify which "side" a mod belongs on ( *server* | *client* | *both* )
- Automatically resolves dependencies for your mods when installing them

And you get all of these things wrapped up in a neat little easy-to-use command line package. Don't worry - if the command line scares you we'll get through it. Just stick with me. If Packwiz sounds like an enticing software for you and your Modpack - read on my friend!

### Install Packwiz

So, your first hurdle will be getting Packwiz installed on your machine where you want to build your modpack. Depending on your system, it could be really simple, or really annoying lol Sorry Windows people 👋 Either way, I will run through the process on both OS systems that I am familiar with: Linux, and (kinda?) Windows. It's been a long time though.

#### Windows Installation

`packwiz` is a command-line tool, so there is no ".exe installer" to double-click. You can choose one of the following methods to get it running.

##### Method 1: Using Scoop (Recommended)

Scoop is the easiest way to manage command-line tools on Windows. It handles the installation and adds `packwiz` to your PATH automatically.

1. **Open PowerShell** and run this command to install Scoop (if you don't have it):

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

1. **Add the Minecraft bucket** (a repository for Minecraft tools):

```bash
scoop bucket add minecraft https://github.com/The-Simples/scoop-minecraft
```

  1. **Install packwiz**:

```bash
scoop install packwiz
```

##### Method 2: Using Go (For Developers)

If you already have [Go](https://go.dev/dl/) installed for development, you can compile the latest version directly from the source.

1. Open your terminal and run:

```bash
go install github.com/packwiz/packwiz@latest
```

1. Ensure your `GOPATH/bin` (usually `%USERPROFILE%\go\bin`) is in your Windows Environment Variables **PATH**.

##### Method 3: Manual Installation (The "Old School" Way)

1. Go to the [packwiz GitHub Actions](https://www.google.com/search?q=https://github.com/packwiz/packwiz/actions) page and click on the latest successful build.
2. Scroll down to **Artifacts** and download the `windows-amd64` zip file.
3. Extract the `packwiz.exe` to a folder (e.g., `C:\Tools\packwiz`).
4. Add that folder to your **System Environment Variables** (PATH) so you can run it from any folder.

#### Verify Installation

To make sure it worked, open a new terminal window and type:

```bash
packwiz --version
```

If it gives you a response, congrats! 🎊🎊 Now you're cooking with Packwiz. Exciting. Next we'll check in with the Linux users for a *very* short tutorial.

#### Linux Installation

##### Manual Install (not reccomended)

Packwiz offers various binaries that you can simply add to a folder in your `$PATH`variable like `~/.local/bin/`and on your next terminal restart you should have access to the command.

##### Package Mangager Install

My recommended way to install Packwiz is to just use your systems package manager to install it using a one-liner command. For me on Arch linux it's just `yay -S packwiz`and the software is mine, and ready to use right afterwards.

### Using Packwiz

Okay - it's installed. You can access it in your terminal. **Now you're cooking, chef** 🍳

Now it's time to learn a little bit of the terminal 😤 It's really not that bad, don't leave lol. I'm going to aim this portion of the tutorial at Windows users, as I'm assuming Linux users are familiar with the basics of the terminal already. Correct me in the comments below if I'm wrong.

#### 1. Create a Modpack

So to create a modpack with Packwiz we wanna use the `packwiz init`command - however, we don't just wanna run that command anywhere or you'll end up with a modpack being built in the middle of your home directory….you don't want that. So to begin, create a folder called `Modpacks`in your home directory. You can use the terminal or your file manager or choice for this step. Once you have a folder made you're going to have to move your terminals **working directory** to be in **that folder you just made.** To do this, just open your terminal: generally they will start you in your home directory, denoted with a `~` or `/home`. Now you just use the `cd`command to **change directory** to the folder you just made - so for example: `cd Modpacks`at which point you'll see your terminal prompt change to show you where you are at now.

Now that you're in your `Modpacks`directory, create another new folder that is the name of the modpack you want to create, then `cd` into that new directory as well. So your path should be something like: `~/Modpacks/MyNewModpack/`.  
Next thing to do is execute the `packwiz init`command into your terminal!!! 🎆

You'll be drilled with a series of questions about your modpack name, author, Minecraft version, and modloader type. Answer all of these questions and you're basically done - now the only thing to do is add some mods dude 💪

#### 2. Adding Mods

Now inside of your modpack directory, if you run the `ls` command (or view it in a file manager) you'll see it's been populated with some `.toml` files. These are a configuration file-type, don't worry too much about it - you shouldn't ever need to mess with these! If you don't see these files in your modpack directory - you probably ran the command in the wrong place. Check your work and try again.

If you **DO** have these files, it's time to go mod hunting! As stated earlier, Packwiz has the ability to add mods from Curseforge **OR** Modrinth, so pick your poison - although be warned, Curseforge mods are sometimes not available to download via their API and users will have to manually download some mods. Modrinth is highly recommended over Curseforge. Curseforge is also full of ads. So yeah. Modrinth.

 Once you've chosen your mod-provider, use their respective command to add mods:
 
 - `packwiz modrinth add <mod-name-here>`
 - `packwiz curseforge add <mod-name-here>`

"Where do I get the mod names?" you ask? Easy. Just use the end slug of any mod page URL and you're good to go. So, if the full mod url was: `https://modrinth.com/mod/sodium` just use the command `packwiz modrinth add sodium` 


Packwiz will go and find the version of the mod for your Minecraft version and your modloader…and it will also let you know **if there is no version for your MC version or modloader** which is really handy as it prevents you from running into version conflict errors before they ever can happen. Packwiz will also **inform you of any mod dependencies and auto-install them** along with the mod that you want. It's really, **really** handy I swear!

Anyways - I think I can set you free for a while now! Just keep adding mods to your pack as you see fit. Come back once you think you've gotten all your mods sorted!

#### 3. Distributing A Pack

Once you've gotten your mod-list sorted, it's time to distribute. It's really easy. Packwiz comes with an `export` command that we can use to produce modpacks from our `.toml` files. Simply use `packwiz <curseforge | modrinth> export` and out it will shit a .zip (Curseforge) or .mrpack (modrinth) modpack for you. These are by the book and uploadable to their respective website - Packwiz isn't limited to just self-hosting a modpack.

Congrats!!! 🎉 You made a modpack in the fuggin' terminal! Good job. Most people don't have the moxy, ya see?

If you're curious about the "self-updating" portion that I mentioned at the top of the post - you'll have to keep reading. We're gonna have to get those files online in order to do that!

#### 4. Self-Updating Servers & Clients

This part of the tutorial is still a W.I.P. as it's a bit of a process to get working!!! 😅

Coming Soon!
