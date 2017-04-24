# Introduction 

## What is Xiami2netease
Xiami2netease is a comman-line tool based on Node.js. It can move all collected songs of the user you specified in Xiami to Netease Cloud Music. ([Chinese Document](README_cn.md))

# Prepare 

> Make sure you have installed Node and NPM before getting start.

# Getting Started 

**Step 1: Clone a copy of the main git repo by running:**

	git clone https://github.com/Zebr415/move-music.git
	
**Step 2: Install npm packages:**

	npm install

# Usage 

	node index.js -u|--uid <xiamiId> -a|--accound <neteaseAccount> -p|--pwd <neteasePassword> [-x|xjson <xiamiJson>] [-c]

# Arguments 

## Required 

**-u**<br/>
**--uid**<br/>
	`<xiamiId>`: Xiami user id

**-a**<br/>
**--account**<br/>
	`<neteaseAccount>`: Netease music logging account 

**-p**<br/>
**--pwd**<br/>
	`<neteasePassword>`: Netease music logging password

## Options 

**-x**<br/>
**--xjson**<br/>
	`<xiamiJson>`: Save the crawling songs you like in xiami to a json file<br/>
	Default: "xiami.json"
	
**-c,**<br/>
**--cellphone**<br/>
	Signing method in Netease music. Using Netease music's account to sign in by default.

# Example 

	node index.js -u 10651177 -a XXX@163.com -p ***
****	
**Hope you will like my music collection. 10651177 is my Xiami Id :-)**