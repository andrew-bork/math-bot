/* jshint esversion: 9 */

const token = "NjI1NDE5MDE3Mjc1ODM0NDA0.XYfQ2Q.b7W-EFRxvHzMuOTCyFsROlh_htU";

const Discord = require('discord.js');
const fs = require("fs");
const client = new Discord.Client();
/**
 * @typedef {{exec: (args: [String], res: Any, rej: Any)}} Command
 * @type {Object.<string, Command>}
 */
var commands = {};
var commandList = [];

var functions = {};

// Load Commands
fs.readdir("./commands", function(err, files) {

    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    console.log("\n\n------ Loading Commands ------\n");
    files.forEach((file) => {
        const command = require("./commands/" + file);
        commands[command.name] = command.exec;
        commands[command.shorthand] = command.exec;
        commandList.push(command);
        console.log("Loaded Command: ", command.name, "(", command.shorthand, ") -> ", command.format);
    });
    commandList.sort(
        (a, b) => {
            return a.name < b.name;
        }
    );
    console.log("\n----- Finished Loading Commands ------\n");
});



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {

    const regex = /".*"|\S+/g;
    const args = [];

    var a = regex.exec(msg.content);
    while (a !== null) {
        args.push(a[0]);
        a = regex.exec(msg.content);
    }

    const comm = args.shift();
    if (comm === ".math" || comm === ".m") {
        const subcommand = args.shift();
        if (subcommand) {
            if (commands[subcommand]) {
                commands[subcommand](args,
                    (out) => {
                        msg.channel.send(out);
                    }, (err) => {
                        msg.channel.send("Error: " + err);
                    }, {
                        commands: commands,
                        commandList: commandList,
                        msg: msg,
                        author: msg.author,
                        functions: functions,
                    });
            } else {
                msg.channel.send("I don't know that command!");
            }
        } else {
            msg.channel.send("Hi!");
        }
    }
});

client.login(token);