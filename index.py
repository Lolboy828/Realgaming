import requests
import discord
from discord.ext import commands
from discord import Embed
from os import getenv

condoFile = open("file/file.rbxl", "rb").read()
intents = discord.Intents.default()
intents.message_content = True
intents.messages = True

bot = commands.Bot(command_prefix="$", intents=intents)

@bot.event
async def on_ready():
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name='MiiRooZ is W'))
    print(f"logged in as: {bot.user}")

async def on_message(message):
    if message.content.startswith("$shop"):
        embed = Embed(
            title='Dows´s Shop',
            description='Here You Can Buy Ingame Ranks',
            color=0x000000
        )

        embed.add_field(
            name='VIP',
            value='[A Private game just for you!](https://www.roblox.com/game-pass/636900008/VIP) | 500 Robux'
        )

        embed.add_field(
            name='Mod',
            value='[Better Commands](https://www.roblox.com/game-pass/641449484/Mod) | 750 Robux'
        )
        embed.add_field(
            name='Admin',
            value='[Slightly More Better Commands](https://www.roblox.com/game-pass/635905941/Admin) | 1000 Robux',
            inline=False
        )
        embed.add_field(
            name='Head Admin',
            value='[Actually Better Commands](https://www.roblox.com/game-pass/637792969/HeadAdmin) | 1700 Robux',
            inline=False
        )
        embed.add_field(
            name='Owner',
            value='[Everything + all Commands](https://www.roblox.com/game-pass/637085951/Owner) | 4500 Robux',
            inline=False
        )

        embed.add_field(
            name='Notes: ',
            value='EVERYTHING IS AUTOMATED. YOU WILL INSTANTLY RECEIVE YOUR PURCHASE ONCE BOUGHT.',
            inline=False
        )

        await message.author.send(embed=embed)

@bot.command(name="upload")
async def upload(ctx, cookie):
    await ctx.send("https://roblox.com/games/" + upload(cookie))

@upload.error
async def upload_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send("Write the Token where it should be Uplaoded on.")

def getXsrf(cookie):
    xsrfResponse = requests.post("https://auth.roblox.com/v2/login", headers={
        "X-CSRF-TOKEN": ""
    }, cookies={
        ".ROBLOSECURITY": cookie
    }).headers["x-csrf-token"]
    return xsrfResponse

def getUserId(cookie):
    xsrf = getXsrf(cookie)
    userIdResponse = requests.get("https://users.roblox.com/v1/users/authenticated", headers={
        "x-csrf-token": xsrf,
        "User-Agent": "Roblox/WinINet"
    }, cookies={
        ".ROBLOSECURITY": cookie
    }).json()["id"]
    return userIdResponse

def getGameId(cookie):
    xsrf = getXsrf(cookie)
    userId = getUserId(cookie)
    gameIdResponse = requests.get("https://inventory.roblox.com/v2/users/" + str(userId) + "/inventory/9?limit=10&sortOrder=Asc", headers={
        "x-csrf-token": xsrf,
        "User-Agent": "Roblox/WinINet"
    }, cookies={
        ".ROBLOSECURITY": cookie
    }).json()["data"][0]["assetId"]
    return gameIdResponse

def upload(cookie):
    xsrf = getXsrf(cookie)
    gameId = getGameId(cookie)
    url = requests.post("https://data.roblox.com/Data/Upload.ashx?assetid=" + str(gameId) + "&type=Place&name=aa&description=aa&genreTypeId=1&ispublic=False", headers={
        "Content-Type": "application/xml",
        "x-csrf-token": xsrf,
        "User-Agent": "Roblox/WinINet"
    }, cookies={
        ".ROBLOSECURITY": cookie
    }, data=condoFile)
    print(f"uploaded to https://roblox.com/games/{str(gameId)}/")
    return gameId
    

bot.run("MTE3NjIwNjQ3OTA3MDYwOTQxOA.GOcEw0.lI8K4Zlre2xoDcEefzxy2e8sh6A-LSX8TI2Ink")