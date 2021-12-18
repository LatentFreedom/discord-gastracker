const {Constants, Client, Intents, MessageEmbed} = require('discord.js');
const axios = require('axios');
require('dotenv').config();

let gasPrices = [];
let alerts = new Map();

const client = new Client({
    intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});

client.on('ready', () => {
    console.log('Gas Tracker Running...');
    createCommands();
    getGas();
});

const createCommands = () => {
    const Guilds = client.guilds.cache.map(guild => guild.id);
    // Add commands to all guilds
    Guilds.forEach(guildId => {
        const guild = client.guilds.cache.get(guildId);
        let commands = guild.commands;
        // gas command
        commands?.create({
            name: "gas",
            description: "replies with current gas prices on etherscan"
        });
        // alert command
        commands?.create({
            name: "alert",
            description: "alert user when gas reaches specified amount",
            options: [
                {
                    name: "amount",
                    description: "gas amount to be alerted for",
                    required: true,
                    type: Constants.ApplicationCommandOptionTypes.NUMBER
                }
            ]
        })
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

    embed.addFields({ name: 'Slow 🐢 | >10 minutes', value: `${gasPrices.result.SafeGasPrice} Gwei` },
        { name: 'Proposed 🚶 | 3 minutes', value: `${gasPrices.result.ProposeGasPrice} Gwei` },
        { name: 'Fast ⚡ | 15 seconds', value: `${gasPrices.result.FastGasPrice} Gwei` },
    );
    return [embed];
    
}


const getGas = async () => {
    try {
        let req = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_PRIV}`;
        const res = await axios.get(req);
        gasPrices = res.data;
        client.user.setActivity(`⚡${gasPrices.result.FastGasPrice} 🚶${gasPrices.result.ProposeGasPrice} 🐢${gasPrices.result.SafeGasPrice}`);
        checkAlerts();
    } catch (err) {
        console.log(err);
    }
}

const checkAlerts = () => {
    alerts.forEach((amounts, author) => {
        amounts.forEach(async (amount, index) => {
            try {
                if (amount >= gasPrices.result.FastGasPrice) {
                    const res = await author.send(`Gas price is now ${gasPrices.result.FastGasPrice} gwei.`);
                    console.log(res);
                    let newAlertList = [...alerts.get(author).slice(0, index), ...alerts.get(author).slice(index+1)];
                    alerts.set(author, newAlertList);
                }
            } catch (err) {
                console.log(err);
            }
        })
    })
}

setInterval(getGas, 10 * 3000);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) { return; }
    const { commandName, options } = interaction;
    if (commandName === 'gas') {
        // Process gas command
        await interaction.deferReply({
            ephemeral: true,
        });
        interaction.editReply({
            embeds: styleMessage(),
        })
    } else if (commandName === 'alert') {
        // Process alert command
        const amount = options.getNumber('amount');
        const user = interaction.user;
        const name = user.username;
        interaction.reply({
            content: `Thanks, **${name}**. I will send a private message when gas is below **${amount}** Gwei.`,
            ephemeral: true
        })
        // Add alert to Mapping
        if (!alerts.has(user)) {
            alerts.set(user, [amount]);
        } else {
            let newAlertList = alerts.get(user);
            newAlertList.push(amount);
            alerts.set(user, newAlertList);
        }
    }
})

client.login(process.env.DISCORD_TOKEN);