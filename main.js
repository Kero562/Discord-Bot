require('dotenv/config');
const { Client, IntentsBitField, MessageEmbed, EmbedBuilder, ButtonStyle, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    PermissionFlagsBits, MessageActionRow, MessageButton, PermissionsBitField, ChannelType, ActionRowBuilder, Events, ModalBuilder,
    TextInputBuilder, TextInputStyle, Embed } = require('discord.js');

const fs = require('fs')
const creds = require('./rr-bot-388121-16e3d8b49f75.json')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { group } = require('console');

const client = new Client({ 
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

let inWar = false;
let inZoneWar = false;

const interactionCooldown = new Map();
//const words = ['word3', 'PM from'];
const prefix = '-';
const unapplicableRequesters = ['1103474044638077021', '783731113259433995']
const ranks = ['Sellsword', 'Centenar', 'Menace', 'Knight', 'Warlord']

client.once('ready', async () => {
    console.log("Bot's online");

    const myGuild = client.guilds.cache.get(process.env.GUILD_ID);

    const button = new ButtonBuilder()
    .setCustomId('open_modal')
    .setLabel('Create a promotion request')
    .setStyle(ButtonStyle.Primary)

const row = new ActionRowBuilder()
    .addComponents(button)

    const permChannel = client.channels.cache.get(process.env.PERM_PROMO_CHANNEL);

    const channelsMsgs = await permChannel.messages.fetch({limit: 1})

    firstMsg = channelsMsgs.first();

    //ALREADY EXECUTED ONCE ------- UNCOMMENT TO RE-EXECUTE IF MESSAGE IS DELETED
    /*
    const buttonMessage = await permChannel.send({content: 'Click the button to make a request', components: [row]});
    collectorCreate(buttonMessage)
    */

    //const buttonMessage = await firstMsg.edit({content: 'Click the button to make a request', components: [row]})

    collectorCreate(firstMsg) //collector's running forever on the last sent channel: the promotion request prompt

    //-- collectorCreate on threads
    
    const directory = process.cwd();

    fs.readdir(directory, (err, files) => {
        if (err)
        {
            console.error('Error')
            return;
        }

        const txts = files.filter((file) => file.endsWith('.txt'));

        txts.forEach(async (file) => {
            fs.readFile(file, 'utf8', (err, data) => {
                if (err)
                {
                    console.error("Error with the loop part/Probably no txt files found");
                    return;
                }
            })

            try {
            const rewireThread = myGuild.channels.cache.find((channel) => channel.name === file.slice(0, -4) && !channel.locked);
            const fetchedMsgs = await rewireThread.messages.fetch({after:0, limit:1});
            const target = fetchedMsgs.first();
            collectorCreate(target);
            } catch (error)
            {
                //
            }
        })
        
    })
    //--

    //--read RakSAMP
    const fileStats = fs.statSync("C:/Users/Kero'/Desktop/sdf/client/src/RakSAMPClient.log")
    const position = fileStats.size;
    readAndUpdateFile("C:/Users/Kero'/Desktop/sdf/client/src/RakSAMPClient.log", position); //start reading from the end of the file
    //--
});

let outerFinal = null;

function readAndUpdateFile(path, position)
{
    const stream = fs.createReadStream(path, {encoding: 'utf8', start: position})

    //Regex to capture everything before and after "Rose Redemption"
    const regex = /\[CMSG\] GROUP WAR: ([^]*?)Rose Redemption([^]*)$/; //"?" missing?
    const regex2 = /\[CMSG\] ZONE WAR: ([^]*?)Rose Redemption([^]*)$/;

    stream.on('data', data => {
        const lines = data.split('\n')
        position += data.length;

        lines.forEach(async line => {
            //regex matching
            if (!line.includes("against"))
        {
            const match = line.match(regex)
            if (match && !inWar) //not really needed, but good practice in case of debegging later, for example, if (match) do stuff otherwise print "match not found" etc
            {
                
                attacker = match[1] //text between "GROUP WAR: " and "Rose Redemption" (attacker)
                attacked = match[2] //text between "Rose Redemption" and the end of the line (which is indicated by the $ sign in the regex in line 123) (the group being attacked)
                if (attacker == "") // if there is no text between GROUP WAR and RR, then we're the ones attacking so..
                {
                    const final = attacked.slice(4) //cut the "vs " from the beginning of the text
                    console.log(`We're attacking ${final}`) //log
                    outerFinal = final
                }
                else //else we're being attacked
                {
                    const final = attacker.slice(0, -3) //cut "vs " from the end of the text
                    console.log(`We're being attacked by ${final}`) //log
                    outerFinal = final
                }

                inWar = true;
            }

            const match2 = line.match(regex2)
            if (match2 && !inZoneWar)
            {
                attacker = match2[1] 
                attacked = match2[2] 
                if (attacker == "")
                {
                    const final = attacked.slice(4) 
                    console.log(`We're attacking ${final}`) 
                    outerFinal = final
                }
                else //else we're being attacked
                {
                    const final = attacker.slice(0, -3) 
                    console.log(`We're being attacked by ${final}`)
                    outerFinal = final
                }

                inZoneWar = true;
            }
        }

        //check for war endings
        if (outerFinal !== null)
    {
            const fixRegex = /\[CMSG\] GROUP WAR: ([^]*?) wins/
            const fixMatch = line.match(fixRegex);

            const fixRegexZone = /\[CMSG\] ZONE WAR: ([^]*?) (takes|keeps)/
            const fixZoneMatch = line.match(fixRegexZone)

            const groupName = "Rose Redemption";

            // Group War
    if (fixMatch)
    {
            if ((fixMatch[1].includes(outerFinal.trim()) || groupName.includes(fixMatch[1])) && inWar)
            {
                console.log("war ended")

                inWar = false;
            }
    }

            // Group Zone War
    if (fixZoneMatch)
    {
            if ((fixZoneMatch[1].includes(outerFinal.trim())  //in case of game cutting down strings; interpreted if "Hall of Malevolence" includes "Hall of Malevolenc" for instance, which it does. Ofc without the space in the end (hence the trim)
            ||groupName.includes(fixZoneMatch[1])) && inZoneWar)
            {
                console.log("zone war ended")

                inZoneWar = false;
            }
    }
        //
    }
        })
})

stream.on('end', () => {
    readAndUpdateFile(path, position)
})

}

const collectorCreate = (buttonMessage) => {
    collector = buttonMessage.createMessageComponentCollector() //removed time
    collector.on('collect', async (interaction) => {

    //promo req collector
    if (interaction.customId === 'open_modal')
    {
        /*
        if (interaction.member.roles.cache.some(role => unapplicableRequesters.includes(role.id)))
        {
            await interaction.reply({content: `<@${interaction.user.id}> You are not eligible for promotion, most probably because you're at the highest rank or already a leader. If there's something wrong, please send a DM to xerkz#5050 or El3#8189`, ephemeral: true});

            return;
        }
        */
        const modal = new ModalBuilder()
            .setCustomId('promoReq')
            .setTitle('RR Promotion Request')

        //create components

        const igName = new TextInputBuilder()
            .setCustomId('igName')
            .setLabel("What is your in-game name?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(20)
            .setMinLength(1)

        const gameId = new TextInputBuilder()
            .setCustomId('gameId')
            .setLabel("Input your ID")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10)
            .setMinLength(1)

        const currentRank = new TextInputBuilder()
            .setCustomId('crank')
            .setLabel("What's your current rank?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        //row them
        const nameActionRow = new ActionRowBuilder().addComponents(igName) //TextInputBuilder HAS to be in its own row
        const idActionRow = new ActionRowBuilder().addComponents(gameId)
        const currentRankRow = new ActionRowBuilder().addComponents(currentRank)

        //add to modal
        modal.addComponents(nameActionRow, idActionRow, currentRankRow)

        //show modal
        await interaction.showModal(modal)
    } else if (interaction.customId === 'accept' || interaction.customId === 'deny')
    {

        //check for leadership role
        const roleId = process.env.LEADERSHIP_ROLE;
        
        if (!interaction.member.roles.cache.some(role => role.id === roleId)) return;
        //

        const modal = new ModalBuilder()
            .setTitle('Decision Modal')

        const additionalInfo = new TextInputBuilder()
            .setCustomId('addInf')
            .setLabel('Closing statement(s) - (Optional)')
            .setRequired(false)
            .setStyle(TextInputStyle.Paragraph)

        const newRank = new TextInputBuilder()
            .setCustomId('nRank')
            .setLabel('Please confirm the promotion rank')
            .setPlaceholder('Warlord')
            .setRequired(true)
            .setStyle(TextInputStyle.Short)

        //components
        if (interaction.customId === 'deny')
        {
                modal.setCustomId('decisionDeny')
                additionalInfo.setPlaceholder('Example: Terrible history of cheating')
        } else {
                modal.setCustomId('decisionAccept')
                additionalInfo.setPlaceholder('Example: Active, friendly, and skilled')
                const newRankActionRow = new ActionRowBuilder().addComponents(newRank)
                modal.addComponents(newRankActionRow);
        }

        const addInfActionRow = new ActionRowBuilder().addComponents(additionalInfo)

        modal.addComponents(addInfActionRow);

        await interaction.showModal(modal)
    }
})
    /*
    //when the collector is done (5000 ms), stop and recreate the collector with the buttonMsg -- ONLY FOR PROMO REQ
    collector.on('end', () => {
    collector.stop()
    collectorCreate(buttonMessage)
    })
    */
}

//Interaction event listener
client.on(Events.InteractionCreate, async interaction => {

    //listener for promoReq
    if (interaction.customId === 'promoReq')
    {
        //Return if the user exits out/doesn't submit
        if (!interaction.isModalSubmit()) return;

        //The response channel
        const submissionChannel = interaction.guild.channels.cache.get(process.env.SUBMISSION_CHANNEL)

        //Check if the user is on a cooldown
        if (interactionCooldown.has(interaction.user.id))
        {
        const cooldownEnd = interactionCooldown.get(interaction.user.id);
        const remainingCooldown = cooldownEnd - Date.now()

        if (remainingCooldown > 0)
            {
                await interaction.deferUpdate()
                submissionChannel.send(`You're on cooldown. Please wait before creating another request! <@${interaction.user.id}>`)
                return;
            }
        }

        //put the user on a cooldown
        //const cooldownDuration = 86400 * 1000 //24 hours
        const cooldownDuration = 1* 1000;
        const cooldownEnd = Date.now() + cooldownDuration;
        interactionCooldown.set(interaction.user.id, cooldownEnd)

        //Exit out on submission and confirm receival
        await interaction.deferUpdate()
        submissionChannel.send(`Submission received <@${interaction.user.id}>`)

        //To remove the user from the cooldown Map once the cooldown is over
        setTimeout(() => {
            interactionCooldown.delete(interaction.user.id);
        }, cooldownDuration)

        //display the info given

        const resultEmbed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Promotion Request`)
            .setDescription(`**Member's IG Name:** ${interaction.fields.getTextInputValue('igName')}\n**Account ID:** ${interaction.fields.getTextInputValue('gameId')}\n**Current Rank**: ${interaction.fields.getTextInputValue('crank')}`)
            .setColor('#c91871')
            .setTimestamp()

        //const decisionChan = interaction.guild.channels.cache.get('1107573940374736946')
        const thread = await submissionChannel.threads.create({
            name: `${interaction.user.username}#${interaction.fields.getTextInputValue('gameId')}`,
            autoArchiveDuration: 60,
            //reason: TBA
        })

        /* does NOT work because globals get updated with the newer interaction
        accName = interaction.fields.getTextInputValue('igName');
        accId = interaction.fields.getTextInputValue('gameId')
        crank = interaction.fields.getTextInputValue('crank')
        */

        const content = `${interaction.fields.getTextInputValue('igName')}\n${interaction.fields.getTextInputValue('gameId')}\n${interaction.fields.getTextInputValue('crank')}\n${interaction.user.id}`

        fs.writeFile(`${thread.name}.txt`, content, 'utf-8', (err) => {
            if (err)
            {
                console.error(err)
                return;
            }
        })

        let sentInfo = await thread.send({embeds: [resultEmbed]})
        //await thread.send(`<@&${process.env.LEADERSHIP_ROLE}> <@&${process.env.MEMBERSHIP_ROLE}> Cast your votes! +/-`)
        await thread.send(`Cast your votes! +/-`)
        app = await AccDeny(sentInfo)
        collectorCreate(app)
    } //ends here

        //Accept App
        else if (interaction.customId === 'decisionAccept')
        {
            if (!interaction.isModalSubmit()) return;

            const appThread = interaction.channel;

            await interaction.deferUpdate()
            appThread.send(`:white_check_mark: Promotion request has been accepted.\n\n${interaction.fields.getTextInputValue('addInf')}`)

            const newAcpt = ButtonBuilder.from(interaction.message.components[0].components[0]).setDisabled(true)
            const newDeny = ButtonBuilder.from(interaction.message.components[0].components[1]).setDisabled(true)

            const updatedRow = new ActionRowBuilder()
                .addComponents(newAcpt, newDeny)

            await interaction.message.edit({components : [updatedRow]})
            await appThread.setLocked(true);

            const groupLog = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL)

            let accName;
            let accId;
            let crank;

            const dataArray = await readAsync(`${appThread.name}.txt`) //created my own promise-based function because I didn't know there was already a built in one (readFileSync)
            accName = dataArray[0]
            accId = dataArray[1]
            crank = dataArray[2]
            promoId = dataArray[3]

            const promoUser = interaction.guild.members.cache.get(promoId) //or client.users.cache.get()
            promoUser.roles.cache.some(role => {
                theRankName = role.name;
                if (ranks.includes(theRankName))
                {
                    switch(theRankName)
                    {
                        case 'Sellsword':
                            roleUpdate(promoUser, role, '783733722301988884')
                            break;

                        case 'Centenar':
                            roleUpdate(promoUser, role, '783733475705749507')
                            break;

                        case 'Menace':
                            roleUpdate(promoUser, role, '868886587763736677')
                            break;
                        
                        case 'Knight':
                            roleUpdate(promoUser, role, '783731113259433995')
                            break;
                    }
                }
            })

            logEmbed = new EmbedBuilder()
                .setTitle(appThread.name)
                .setDescription(`**Account Name**: ${accName}\n**Account ID:** ${accId}\n**Current Rank**: ${crank}\n**Action Taken:** Set to ${interaction.fields.getTextInputValue('nRank')}\n**Taken By:** ${interaction.user}`)
                .setColor('#212625')
                .setTimestamp()

            groupLog.send({embeds: [logEmbed]})

            updateSpreadsheet(accId)

            fs.unlinkSync(`${appThread.name}.txt`);

        } else if (interaction.customId === 'decisionDeny') //Deny app
        {
            if (!interaction.isModalSubmit()) return;

            const appThread = interaction.channel;

            await interaction.deferUpdate()
            appThread.send(`:x: Promotion request has been denied.\n\n ${interaction.fields.getTextInputValue('addInf')}`)

            const newAcpt = ButtonBuilder.from(interaction.message.components[0].components[0]).setDisabled(true)
            const newDeny = ButtonBuilder.from(interaction.message.components[0].components[1]).setDisabled(true)

            const updatedRow = new ActionRowBuilder()
                .addComponents(newAcpt, newDeny)

            await interaction.message.edit({components : [updatedRow]})
            await appThread.setLocked(true);

            fs.unlinkSync(`${appThread.name}.txt`);
        }
})

const updateSpreadsheet = async (accId) => {
    const doc = new GoogleSpreadsheet('150nN3PPSffgTsLmXX-suqy5wAg-YMnbQWTqCS9YIvn8')
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsById[0];

    await sheet.loadCells('F1:H91');

    let counter = 1;
    let cell = sheet.getCellByA1(`F${counter}`)
    try {
        while(cell.value != accId)
        {
            counter++;
            cell = sheet.getCellByA1(`F${counter}`)
        }
        let rankCell = sheet.getCellByA1(`H${counter}`)
        
        switch (rankCell.value)
        {
            case 'Sellsword':
                rankCell.value = 'Centenar'
                break;
            
            case 'Centenar':
                rankCell.value = 'Menace'
                break;

            case 'Menace':
                rankCell.value = 'Knight'
                break;
            
            case 'Knight':
                rankCell.value = 'Warlord'
                break;
        }

        await sheet.saveUpdatedCells();
    } catch (error)
    {
        return 'Error updating the spreadsheet'
    }
}

const AccDeny = async (message) => {
    const acptBtn = new ButtonBuilder()
        .setCustomId('accept')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)

    const denyBtn = new ButtonBuilder()
        .setCustomId('deny')
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
    
    const BtnRow = new ActionRowBuilder().addComponents(acptBtn, denyBtn) //same row

    finalMsg = await message.edit({components: [BtnRow]})

    return finalMsg;
}

const roleUpdate = (promoUser, role, newRoleId) => {
    promoUser.roles.remove(role)
    const newRole = promoUser.guild.roles.cache.get(newRoleId)
    promoUser.roles.add(newRole)
}

const readAsync = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            totalData = data.toString()
            lines = totalData.split('\n')
            resolve([lines[0], lines[1], lines[2], lines[3]])
        })
    })
}

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (command === 'editlog')
    {
        if (message.channel.id !== '1108068741528436887') return;
        if (!message.member.roles.cache.some(role => role.id === process.env.LEADERSHIP_ROLE)) return;

        if (args[0] == null || args[1] == null || args[2] == null)
        {
            message.channel.send('Wrong format. Use -editlog [MESSAGEID] [ID/NAME/CR/AT] [CHANGE]')
            //return ?
        }

        let messageId = args[0]
        let portion = args[1]
        let change = args[2]

        messageContainingEmbed = await message.channel.messages.fetch(messageId)
        let embedNeeded = new EmbedBuilder()

        if (messageContainingEmbed.embeds.length > 0)
        {
            embedNeeded = messageContainingEmbed.embeds[0]
        } else {
            message.channel.send('This message is not a log.')
        }

        let originalMessage = embedNeeded.description;

        if (portion.toLowerCase() == 'name')
        {
            const start = "**Account Name**: "
            const end = "\n**Account ID:**"

            embedEditor(start, end, originalMessage, messageContainingEmbed, change, embedNeeded, message)
        } else if (portion.toLowerCase() == 'id')
        {
            const start = "**Account ID:** "
            const end = "\n**Current Rank**"

            embedEditor(start, end, originalMessage, messageContainingEmbed, change, embedNeeded, message)
        } else if (portion.toLowerCase() == 'cr')
        {
            const start = "**Current Rank**: "
            const end = "\n**Action Taken:**"

            embedEditor(start, end, originalMessage, messageContainingEmbed, change, embedNeeded, message)
        } else if (portion.toLowerCase() == 'at')
        {
            /*
            let text = embedNeeded.description

            let newText = text.substring(0, text.indexOf("Set to ") + 7) + change

            let resultEmbed = new EmbedBuilder(embedNeeded).setDescription(newText)

            messageContainingEmbed.edit({embeds: [resultEmbed]})

            message.react('✅');
            */

            const start = "**Action Taken:** Set to "
            const end = "\n**Taken By:**"

            embedEditor(start, end, originalMessage, messageContainingEmbed, change, embedNeeded, message)
        }
    }
});

const embedEditor = (start, end, originalMessage, messageContainingEmbed, change, embedNeeded, message) => {
    const startPos = originalMessage.indexOf(start) + start.length
    const endPos = originalMessage.indexOf(end)

    const portionToReplace = originalMessage.substring(startPos, endPos)

    const newDescription = originalMessage.replace(portionToReplace, change)

    let resultEmbed = new EmbedBuilder(embedNeeded).setDescription(newDescription)

    messageContainingEmbed.edit({embeds: [resultEmbed]})

    message.react('✅');
}

client.login(process.env.TOKEN);