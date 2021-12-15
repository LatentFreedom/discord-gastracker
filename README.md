# Discord Gas Tracker Bot
Get a Bot to change it's activity status to the current gas prices for Ethereum.

## Sites Used
1. Discord Dev URL **[https://discord.com/developers/applications](https://discord.com/developers/applications)**
2. Discord Bot Docs **[https://discord.com/developers/docs/intro](https://discord.com/developers/docs/intro)**
3. Etherscan API gas tracker **[https://docs.etherscan.io/api-endpoints/gas-tracker](https://docs.etherscan.io/api-endpoints/gas-tracker)**

## Running the bot
1. Get the needed packages with `npm install`
2. Create `.env` and fill it with the needed values
3. run with `node index.js`

## Values in `.env`
```
DISCORD_TOKEN=
ETHERSCAN_PRIV=
```

## Discord / Commands
1. **gas:** replies with current gas prices on etherscan
2. **alert:** alert user when gas reaches specified amount