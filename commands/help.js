/* jshint esversion: 9 */

const Discord = require("discord.js");

module.exports = {
    name: "help",
    shorthand: "h",
    format: "help [command]",
    description: "Show command list",
    exec: (args, res, rej, ctx) => {



        // inside a command, event listener, etc.
        const exampleEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Math Bot Help');


        ctx.commandList.forEach(
            (command) => {
                exampleEmbed.addField(command.name, command.format);
            }
        );

        res(exampleEmbed);
    }
};