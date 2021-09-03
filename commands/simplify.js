/* jshint esversion: 9 */

module.exports = {
    name: "simplify",
    shorthand: "s",
    format: "simplify <expression>",
    exec: (args, res, rej, ctx) => {
        const Simplify = require("../helpers/simplify.js");
        const Expression = require("../helpers/expression.js");

        const unparsed = args.shift();
        const option1 = args.shift();

        const options = {
            debug: false,
        };

        if (option1 === "-debug") {
            options.debug = true;
        }

        if (unparsed) {
            try{
                const parseterms = Expression.getTerms(unparsed);
                const expression = Expression.getExpression(parseterms);
                const start = process.hrtime();
                try{
                    const simplified = Simplify.simplify(expression);
                    const end = process.hrtime();
                    console.log((end[1] - start[1]) / 1000000000, " secs to simplify");
                    res("```\n" + Expression.prettyPrint(simplified) + (options.debug ? "\n" + Expression.debugPrint(expression) : "") + "```");
                    return;
                }catch(e){
                    rej("Something has went wrong during simplification.")
                }
            }catch(e){
                rej("Something has went wrong during parsing.");
                return;
            }
        } else {
            rej("You need to specify an expression");
        }
    }
};