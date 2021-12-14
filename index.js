const {Client, Intents, MessageEmbed} = require('discord.js');
const axios = require('axios');
const client = new Client({intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]});
require('dotenv').config();

client.once('ready', () => {
    console.log('Running...')
    getGas();
});

let gasPrices = [];
let alerts = new Map();
var fs = require('fs');

const saveAlerts = (alertData) => {
    fs.writeFile("./alerts.json", JSON.stringify(alertData), function(err) {
        if (err) {
            console.log(err);
        }
    });
}

const getAlerts = () => {
    fs.readFile('./alerts.json', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        alerts = JSON.parse(data.toString());
    });
}

const styleMessage = () => {
    const embed = new MessageEmbed().setTitle('⛽ Current Gas Prices');
    if (gasPrices.result.FastGasPrice > 100) {
        embed.setColor('#ff0000');
    } else if (gasPrices.result.FastGasPrice > 40) {
        embed.setColor('#ff8000');
    } else {
        embed.setColor('#2fff00');
    }

    embed.addFields(
		{ name: 'Slow 🐢 | >10 minutes', value: `${gasPrices.result.SafeGasPrice} Gwei` },
        { name: 'Proposed 🙂 | 3 minutes', value: `${gasPrices.result.ProposeGasPrice} Gwei` },
        { name: 'Fast ⚡ | 15 seconds', value: `${gasPrices.result.FastGasPrice} Gwei` },
    );
    return {embeds : [embed]};
    
}


getGas = () => {
    let req = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_PRIV}`;
    axios.get(req).then(res => {
        gasPrices = res.data;
        client.user.setActivity(`⚡${gasPrices.result.FastGasPrice} 🙂${gasPrices.result.ProposeGasPrice} 🐢${gasPrices.result.SafeGasPrice}`);
        checkAlerts();
    })
    
}

checkAlerts = () => {
    try {
        alerts.forEach((amounts, author) => {
            amounts.forEach((amount, index) => {
                if(amount >= gasPrices.result.FastGasPrice) {
                    author.send(`Gas price is now ${gasPrices.result.FastGasPrice} gwei.`);
                    let newAlertList = [...alerts.get(author).slice(0, index), ...alerts.get(author).slice(index+1)];
                    alerts.set(author, newAlertList);
                }
            })
        })
    } catch (err) {
        console.log(err);
    }
}

setInterval(getGas, 10 * 5000);

client.on('messageCreate', message => {
    const prefix = '/gas';
    if (message.content.startsWith(prefix)) {
        let args = message.content.slice(prefix.length+1).trim().split(' ');
        if(args[0] === '') args = args.splice(0,0);
        if(args.length === 0) {
            message.channel.send(styleMessage());
        }
        if(args[0] === 'alert' && args.length === 2) {
            let amount = args[1];
            let user = message.author;
            let name = message.member.nickname ? message.member.nickname : message.member.user.username;
            message.channel.send(`Thanks, ${name}. I will send you a private message when gas price drops below ${amount} gwei.`);
            if(!alerts.has(user)) {
                alerts.set(user, [amount]);
            } else {
                let newAlertList = alerts.get(user);
                newAlertList.push(amount);
                alerts.set(user, newAlertList);
            }
            saveAlerts(alerts);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);