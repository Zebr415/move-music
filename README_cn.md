# 介绍 
## Xiami2netease 是什么
Xiami2netease 是基于 Node.js 实现的命令行工具，用于迁移 **虾米音乐** 指定用户所收藏的音乐至你的 **网易云音乐** 中的 **我喜欢的音乐** 列表中。
（英文文档详见[README.md](README.md)）

# 准备
> 在使用该工具前，请确保你已经安装了 **Node.js** 以及 **NPM**。


# 安装
**步骤一：将该项目仓库克隆下来并进入该目录**
	我们使用 `git clone` 指令将该项目仓库复制一份到当前目录，并在完成后使用 `cd` 指令进入该目录。

	git clone https://github.com/Zebr415/move-music.git
	
	cd move-music
	
**步骤二：安装该项目所需依赖**
	我们使用 `npm install`指令安装该项目所需依赖。
	npm install

# 使用方法

	node index.js -u|--uid <xiamiId> -a|--accound <neteaseAccount> -p|--pwd <neteasePassword> [-x|xjson <xiamiJson>] [-c]

# 参数 

## 必要参数

**-u**<br/>
**--uid**<br/>
	`<xiamiId>`: 该参数为所要爬取的 **虾米音乐** 用户id。

**-a**<br/>
**--account**<br/>
	`<neteaseAccount>`: 该参数为你的 **网易云音乐** 登录账户（网易邮箱／手机号）。

**-p**<br/>
**--pwd**<br/>
	`<neteasePassword>`: 该参数为你的 **网易云音乐** 登录密码。

## 可选参数

**-x**<br/>
**--xjson**<br/>
	`<xiamiJson>`: 该参数为 json文件，该文件用于存储 **虾米音乐** 上爬取的所有用户收藏音乐。<br/>
	默认值: "xiami.json"
	
**-c,**<br/>
**--cellphone**<br/>
	该指令用于切换 **网易云音乐** 的登录方式。默认使用网易邮箱进行用户登录，如使用该指令则切换为手机号进行用户登录。

# 示例

	node index.js -u 10651177 -a XXX@163.com -p ***
****	
**希望你也能喜欢我所收藏的音乐. 10651177 是我的虾米音乐id :-)**