/* jshint esversion: 9 */

const {
    parse
} = require("path");
const {
    trace
} = require("console");

/**
 * 
 * @param {String} string
 * @returns {{type: String, index: Number, val: String}} 
 */

function getTerms(string) {
    const terms = /(?<trig>sin|cos|tan)|(?<variable>[A-Za-z])|(?<unary>(?<=\-)\-|(?<=\+)\-|(?<=\*)\-|(?<=\/)\-|(?<=\^)\-)|(?<operators>\+|\-|\*|\/|\^|\(|\))|(?<numbers>\d+)/g;
    const result = [];
    var x = terms.exec(string);
    while (x) {
        if (x.groups.variable) {
            result.push({
                type: "variable",
                index: x.index,
                val: x[0]
            });
        } else if (x.groups.trig) {
            result.push({
                type: "trig",
                index: x.index,
                val: x[0]
            });
        } else if (x.groups.unary) {
            result.push({
                type: "unary",
                index: x.index,
                val: x[0]
            });
        } else if (x.groups.operators) {
            result.push({
                type: "operator",
                index: x.index,
                val: x[0]
            });
        } else if (x.groups.numbers) {
            result.push({
                type: "number",
                index: x.index,
                val: x[0],
            });
        }
        x = terms.exec(string);
    }

    return result;
}

/**
 * @typedef {Constant|ParseError|Add|Sub|Mult|Div|Pow|Variable|Term|FlatAdd|FlatMult} Expression
 * @typedef {{type: "add", subtype: "binary", expL: Expression, expR: Expression}} Add
 * @typedef {{type: "flatadd", subtype: "flat", expList: [Expression]}} FlatAdd
 * @typedef {{type: "sub", subtype: "binary", expL: Expression, expR: Expression}} Sub
 * @typedef {{type: "mult", subtype: "binary", expL: Expression, expR: Expression}} Mult
 * @typedef {{type: "flatmult", subtype: "flat", expList: [Expression]}} FlatMult
 * @typedef {{type: "div", subtype: "binary", expL: Expression, expR: Expression}} Div
 * @typedef {{type: "pow", subtype: "binary", expL: Expression, expR: Expression}} Pow
 * @typedef {{type: "constant", subtype: "single", val: Number}} Constant
 * @typedef {{type: "variable", subtype: "single", name: String}} Variable
 * @typedef {{type: "term", subtype: "binary", coeff: Constant, base: Expression}} Term
 * @typedef {{type: "error", subtype: "error", reason: String, index: Number, }} ParseError
 */

/**
 * 
 * @param {[{type: String, index: Number, val: String}]} input
 * @returns {Expression} 
 */
function getExpression(input) {

    const parenthesis = [];
    var now = 0;
    input.forEach((value) => {

        if (value.val === "(") {
            now++;
        } else if (value.val === ")") {
            now--;
        }

        if (now < 0) {
            return {
                type: "error",
                subtype: "error",
                reason: "Extra closing parenthesis",
                index: i,
            };
        }
        parenthesis.push(now);
    });

    if (now != 0) {
        return {
            type: "error",
            subtype: "error",
            reason: "Missing closing parenthesis",
            index: i,
        };
    }

    return flatten(parseExpression(input, parenthesis));
}

/**
 * @param {[{type: String, index: Number, val: String}]} string
 * @param {[Number]} parenthesis
 * @param {Number} start
 * @param {Number} end
 * @param {Number} parenthesisOffset
 * @returns {Expression}
 */

function parseExpression(string, parenthesis, start = 0, end = string.length - 1, parenthesisOffset = 0) {
    //console.log("Parsing", string.slice(start, end + 1), parenthesis, parenthesisOffset);
    if (start > end) {
        return {
            type: "error",
            subtype: "error",
            reason: "Couldn't find an expression",
            index: start,
        };
    }

    var isSurrounded = string[start].val === "(" && string[end].val === ")";
    if (isSurrounded) {
        for (let i = start + 1; i < end; i++) {
            if (parenthesis[i] - parenthesisOffset === 0) {
                isSurrounded = false;
                break;
            }
        }
        if (isSurrounded) {
            return parseExpression(string, parenthesis, start + 1, end - 1, parenthesisOffset + 1);
        }
    }

    for (let i = end; i > start; i--) {
        if (parenthesis[i] - parenthesisOffset == 0 && string[i].type === "operator") {
            const curr = string[i].val;
            if (curr == "+") {
                const left = parseExpression(string, parenthesis, start, i - 1, parenthesisOffset);
                const right = parseExpression(string, parenthesis, i + 1, end, parenthesisOffset);
                return {
                    type: "add",
                    subtype: "binary",
                    expL: left,
                    expR: right,
                };
            } else if (curr == "-") {
                const left = parseExpression(string, parenthesis, start, i - 1, parenthesisOffset);
                const right = parseExpression(string, parenthesis, i + 1, end, parenthesisOffset);
                return {
                    type: "add",
                    subtype: "binary",
                    expL: left,
                    expR: {
                        type: "mult",
                        subtype: "binary",
                        expL: {
                            type: "constant",
                            subtype: "single",
                            val: -1
                        },
                        expR: right,
                    },
                };
            }
        }
    }

    for (let i = end; i >= start; i--) {
        if (parenthesis[i] - parenthesisOffset == 0 && string[i].type === "operator") {
            const curr = string[i].val;
            if (curr == "*") {
                const left = parseExpression(string, parenthesis, start, i - 1, parenthesisOffset);
                const right = parseExpression(string, parenthesis, i + 1, end, parenthesisOffset);
                return {
                    type: "mult",
                    subtype: "binary",
                    expL: left,
                    expR: right,
                };
            } else if (curr == "/") {
                const left = parseExpression(string, parenthesis, start, i - 1, parenthesisOffset);
                const right = parseExpression(string, parenthesis, i + 1, end, parenthesisOffset);
                return {
                    type: "mult",
                    subtype: "binary",
                    expL: left,
                    expR: {
                        type: "pow",
                        subtype: "binary",
                        expL: right,
                        expR: {
                            type: "constant",
                            subtype: "single",
                            val: -1,
                        },
                    },
                };
            }
        }
    }

    for (let i = end; i >= start; i--) {
        if (parenthesis[i] - parenthesisOffset == 0 && string[i].type === "operator") {
            const curr = string[i].val;
            if (curr == "^") {
                const left = parseExpression(string, parenthesis, start, i - 1, parenthesisOffset);
                const right = parseExpression(string, parenthesis, i + 1, end, parenthesisOffset);
                return {
                    type: "pow",
                    subtype: "binary",
                    expL: left,
                    expR: right,
                };
            }
        }
    }

    var a;

    if (string[start].type === "number") {
        const val = parseFloat(string[start].val);
        if (isNaN(val)) {
            a = {
                type: "error",
                subtype: "error",
                reason: "expected a number",
                index: start,
            }
        } else {
            a = {
                type: "constant",
                subtype: "single",
                val: val,
            };
        }
        if (start != end) {
            const r = parseExpression(string, parenthesis, start + 1, end, parenthesisOffset);
            return {
                type: "mult",
                subtype: "binary",
                expL: a,
                expR: r,
            };
        }
    } else if (string[start].type === "variable") {
        a = {
            type: "variable",
            subtype: "single",
            name: string[start].val,
        };
        if (start != end) {
            const r = parseExpression(string, parenthesis, start + 1, end, parenthesisOffset);
            return {
                type: "mult",
                subtype: "binary",
                expL: a,
                expR: r,
            };
        }
    } else if (string[start].type === "operator") {
        if (string[start].val === "(") {
            for (var i = start; i <= end; i++) {
                if (parenthesis[i] - parenthesisOffset === 0) {
                    return {
                        type: "mult",
                        subtype: "binary",
                        expL: parseExpression(string, parenthesis, start, i, parenthesisOffset),
                        expR: parseExpression(string, parenthesis, i + 1, end),
                    };
                }
            }
        }
    }


    return a;
}

/**
 * 
 * @typedef {{type: "error", reason: String}} EvaluateError
 * 
 * @param {Expression} expression 
 * @param {Any} vars
 * 
 * @returns {Number|EvaluateError} 
 */
function evaluate(expression, vars) {
    const type = expression.type;
    switch (type) {
        case "add":
            var l = evaluate(expression.expL, vars);
            var r = evaluate(expression.expR, vars);
            if (l.type === "error") {
                return l;
            } else if (r.type === "error") {
                return r;
            }
            return l + r;
        case "sub":
            l = evaluate(expression.expL, vars);
            r = evaluate(expression.expR, vars);
            if (l.type === "error") {
                return l;
            } else if (r.type === "error") {
                return r;
            }
            return l - r;
        case "mult":
            l = evaluate(expression.expL, vars);
            r = evaluate(expression.expR, vars);
            if (l.type === "error") {
                return l;
            } else if (r.type === "error") {
                return r;
            }
            return l * r;
        case "div":
            l = evaluate(expression.expL, vars);
            r = evaluate(expression.expR, vars);
            if (l.type === "error") {
                return l;
            } else if (r.type === "error") {
                return r;
            }
            return l / r;
        case "pow":
            l = evaluate(expression.expL, vars);
            r = evaluate(expression.expR, vars);
            if (l.type === "error") {
                return l;
            } else if (r.type === "error") {
                return r;
            }
            return l ** r;
        case "constant":
            return expression.val;
        case "error":
            return {
                type: "error",
                    reason: expression.reason,
            };
        case "variable":
            if (vars[expression.name]) {
                return vars[expression.name];
            } else {
                return {
                    type: "error",
                    reason: `Variable ${expression.name} is not given`
                };
            }
        case "flatadd":
            var out = 0;
            expression.expList.forEach(
                (exp) => {
                    out += evaluate(exp,vars);
                }
            );
            return out;
        case "flatmult":
            var out = 1;
            expression.expList.forEach(
                (exp) => {
                    out *= evaluate(exp,vars);
                }
            );
            return out;
    }
}

/**
 * 
 * @param {Expression} expression 
 * @returns {String}
 */

function prettyPrint(expression) {
    const type = expression.type;
    var out = "";
    if (type === "add") {
        return "(" + prettyPrint(expression.expL) + ") + (" + prettyPrint(expression.expR) + ")";
    } else if (type === "sub") {
        return "(" + prettyPrint(expression.expL) + ") - (" + prettyPrint(expression.expR) + ")";
    } else if (type === "mult") {
        return "(" + prettyPrint(expression.expL) + ") * (" + prettyPrint(expression.expR) + ")";
    } else if (type === "div") {
        return "(" + prettyPrint(expression.expL) + ") / (" + prettyPrint(expression.expR) + ")";
    } else if (type === "pow") {
        return "(" + prettyPrint(expression.expL) + ") ^ (" + prettyPrint(expression.expR) + ")";
    } else if (type === "constant") {
        return expression.val;
    } else if (type === "variable") {
        return expression.name;
    } else if (type === "flatadd") {
        expression.expList.forEach(
            (exp, i) => {
                out += prettyPrint(exp);
                if (i != expression.expList.length - 1) {
                    out += " + ";
                }
            }
        );
        return out;
    } else if (type === "flatmult") {
        expression.expList.forEach(
            (exp, i) => {
                out += prettyPrint(exp);
                if (i != expression.expList.length - 1) {
                    out += " * ";
                }
            }
        );
        return out;
    }
}
/**
 * 
 * @param {Expression} expression 
 * @returns {Expression}
 */
function flatten(expression) {
    const traceLeaves = (node, out, searching) => {
        if (node.type === searching) {
            traceLeaves(node.expL, out, searching);
            traceLeaves(node.expR, out, searching);
        } else {
            out.push(node);
        }
    };

    if (expression.type === "add") {
        /** @type {[Expression]} */
        const out = [];
        /** @type {(node: Expression, out: [Expression]) => null */
        const traceLeaves = (node, out) => {
            if (node.type === "add") {
                traceLeaves(node.expL, out);
                traceLeaves(node.expR, out);
            } else if (node.type === "flatadd") {
                node.expList.forEach(
                    (a) => {
                        traceLeaves(a, out);
                    }
                );
            } else {
                out.push(node);
            }
        };
        traceLeaves(expression, out);
        return {
            type: "flatadd",
            subtype: "flat",
            expList: out.map(
                (term) => {
                    return flatten(term);
                }
            )
        };
    } else if (expression.type === "mult") {
        const out = [];
        traceLeaves(expression, out, "mult");
        return {
            type: "flatmult",
            subtype: "flat",
            expList: out.map(
                (term) => {
                    return flatten(term);
                }
            )
        };
    } else if (expression.subtype === "binary") {
        return {
            type: expression.type,
            subtype: "binary",
            expL: flatten(expression.expL),
            expR: flatten(expression.expR)
        };
    } else if (expression.type === "flatadd") {
        console.log("Shit: ", expression);
        const out = [];
        const traceFlat = (input) => {
            if (input.type === "flatadd") {
                input.expList.forEach(
                    (exp) => {
                        traceFlat(exp);
                    }
                );
            } else {
                out.push(input);
            }
        };
        traceFlat(expression);
        return {
            type: "flatadd",
            subtype: "flat",
            expList: out.map(
                (term) => {
                    return flatten(term);
                }
            ),
        };
    } else if (expression.type === "flatmult") {

    }
    return expression;
}


/**
 * 
 * @param {Expression} expression 
 * @returns {String}
 */

function debugPrint(expression) {
    const type = expression.type;
    var out = "";
    if (type === "add") {
        return "(" + debugPrint(expression.expL) + ") + (" + debugPrint(expression.expR) + ")";
    } else if (type === "sub") {
        return "(" + debugPrint(expression.expL) + ") - (" + debugPrint(expression.expR) + ")";
    } else if (type === "mult") {
        return "(" + debugPrint(expression.expL) + ") * (" + debugPrint(expression.expR) + ")";
    } else if (type === "div") {
        return "(" + debugPrint(expression.expL) + ") / (" + debugPrint(expression.expR) + ")";
    } else if (type === "pow") {
        return "(" + debugPrint(expression.expL) + ") ^ (" + debugPrint(expression.expR) + ")";
    } else if (type === "constant") {
        return expression.val;
    } else if (type === "variable") {
        return expression.name;
    } else if (type === "flatadd") {
        expression.expList.forEach(
            (exp, i) => {
                out += `(${debugPrint(exp)})`;
                if (i != expression.expList.length - 1) {
                    out += " + ";
                }
            }
        );
        return out;
    } else if (type === "flatmult") {
        expression.expList.forEach(
            (exp, i) => {
                out += `(${debugPrint(exp)})`;
                if (i != expression.expList.length - 1) {
                    out += " * ";
                }
            }
        );
        return out;
    }
}

/**
 * 
 * @param {Expression} expressionA 
 * @param {Expression} expressionB 
 * @returns {Expression}
 */
function multiply(expressionA, expressionB) {
    if (expressionA.type === "flatadd") {
        if (expressionB.type === "flatadd") {
            const out = [];
            expressionA.expList.forEach(
                (subexpA) => {
                    expressionB.expList.forEach(
                        (subexpB) => {
                            out.push({
                                type: "flatmult",
                                subtype: "flat",
                                expList: [subexpA, subexpB]
                            });
                        }
                    );
                }
            );
            return {
                type: "flatadd",
                subtype: "flat",
                expList: out,
            };
        } else if (expressionB.type === "flatmult") {
            return {
                type: "flatadd",
                subtype: "flat",
                expList: expressionA.expList.map(
                    (subexp) => {
                        return {
                            type: "flatmult",
                            subtype: "flat",
                            expList: [expressionB, subexp]
                        };
                    }
                )
            };
        } else {
            return {
                type: "flatadd",
                subtype: "flat",
                expList: expressionA.expList.map(
                    (subexp) => {
                        return {
                            type: "flatmult",
                            subtype: "flat",
                            expList: [expressionB, subexp]
                        };
                    }
                )
            };
        }
    } else if (expressionA.type === "flatmult") {
        if (expressionB.type === "flatadd") {
            return {
                type: "flatadd",
                subtype: "flat",
                expList: expressionB.expList.map(
                    (subexp) => {
                        return {
                            type: "flatmult",
                            subtype: "flat",
                            expList: [expressionA, subexp]
                        };
                    }
                )
            };
        } else if (expressionB.type === "flatmult") {
            return {
                type: "flatmult",
                subtype: "flat",
                expList: expressionA.expList.concat(expressionB.expList),
            };
        } else {
            return {
                type: "flatmult",
                subtype: "flat",
                expList: expressionA.expList.concat(expressionB),
            };
        }
    } else {
        if (expressionB.type === "flatadd") {
            return {
                type: "flatadd",
                subtype: "flat",
                expList: expressionB.expList.map(
                    (subexp) => {
                        return {
                            type: "flatmult",
                            subtype: "flat",
                            expList: [expressionA, subexp]
                        };
                    }
                )
            };
        } else if (expressionB.type === "flatmult") {
            return {
                type: "flatmult",
                subtype: "flat",
                expList: expressionB.expList.concat(expressionB),
            };
        } else {
            return {
                type: "flatmult",
                subtype: "flat",
                expList: [expressionA, expressionB]
            };
        }
    }
}


module.exports = {
    getTerms: getTerms,
    getExpression: getExpression,
    evaluate: evaluate,
    prettyPrint: prettyPrint,
    flatten: flatten,
    multiply: multiply,
    debugPrint: debugPrint,
};