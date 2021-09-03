/* jshint esversion: 9 */

const Discord = require("discord.js");

module.exports = {
    name: "eval",
    shorthand: "e",
    format: "eval <function name> <value>",
    description: "Evaluate a function at a given value. Function must be defined by the \"define\" command.",
    exec: (args, res, rej, ctx) => {

        const name = args.shift();
        const value = args.shift();

        if(!name){
            rej("No function name given!");
            return;
        }
        if(!value){
            rej("No value given!");
            return;
        }

        const Expression = require("../helpers/expression.js");

        if(!ctx.functions[name]){
            rej(`Function ${name} is not defined!`);
            return;
        }

        const out = Expression.evaluate(ctx.functions[name], {x: parseFloat(value)});

        res(`${name}(${value}) = ${out}`);
    }
};