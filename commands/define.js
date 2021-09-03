/* jshint esversion: 9 */

const Discord = require("discord.js");

module.exports = {
    name: "define",
    shorthand: "d",
    format: "define <function name> <expression>",
    description: "Define an expression with a given name",
    exec: (args, res, rej, ctx) => {

        const name = args.shift();
        const exp = args.shift();

        if(!name){
            rej("No function name given!");
            return;
        }
        if(!exp){
            rej("No expression given!");
            return;
        }

        const Expression = require("../helpers/expression.js");

        const expression = Expression.getExpression(Expression.getTerms(exp));

        if(expression.type == "error"){
            rej("Invalid syntax!");
            return;
        }
        ctx.functions[name] = expression;

        res(`Successfully defined ${name} = ${Expression.prettyPrint(expression)}`);
    }
};