/* jshint esversion: 9 */

const { trace } = require("console");
const Expression = require("./expression");
const { flatten } = require("./expression");

/**
 * @typedef {import("./expression").Expression} Expression
 * @typedef {import("./expression").Constant} Constant
 * 
 * @param {Expression} expression 
 */

function simplify(expression) {
    console.log("BRUH, ",expression);
    const finishedArithmetic = evaluateArithmetic(expression);
    console.log("A, ", finishedArithmetic);
    const noComplexTerms = Expression.flatten(multiplyOutAllComplexTerms(finishedArithmetic));
    console.log("B, ", noComplexTerms);
    const finishedArithmeticAndNoComplexTerms = evaluateArithmetic(noComplexTerms);
    console.log("C, ", finishedArithmeticAndNoComplexTerms);
    const multipliedTermsCombinedFinishedArithmeticAndNoComplexTerms = combineMultiplyTerms(finishedArithmeticAndNoComplexTerms);
    console.log("D, ", multipliedTermsCombinedFinishedArithmeticAndNoComplexTerms);
    //const likeTermsCombinedFinishedArithmeticAndNoComplexTerms = combineLikeTerms(finishedArithmeticAndNoComplexTerms);

    return multipliedTermsCombinedFinishedArithmeticAndNoComplexTerms;
}




/**
 * 
 * @param {Expression} expression 
 */
function multiplyOutAllComplexTerms(expression) {
    if (expression.type === "flatadd") {
        return {
            type: "flatadd",
            subtype: "flat",
            expList: expression.expList.map(
                (subexp) => {
                    return multiplyOutAllComplexTerms(subexp);
                }
            )
        };
    } else if (expression.type === "flatmult") {

        var out = expression.expList[0];
        expression.expList.forEach(
            (subexp, i) => {
                if (i > 0) {
                    out = Expression.multiply(out, subexp);
                }
            }
        );

        return out;
    } else if (expression.type === "pow") {

    }
    return expression;
}

/**
 * 
 * @param {Expression} expression 
 * @returns {Expression}
 */
function evaluateArithmetic(expression) {
    if (expression.type === "flatadd") {
        /** @type {Constant} */
        const constant = {
            type: "constant",
            subtype: "single",
            val: 0
        };
        const left = [];
        expression.expList.forEach(
            (exp) => {
                const yee = evaluateArithmetic(exp);
                console.log(yee);

                if (yee.type === "constant") {
                    constant.val += yee.val;
                } else {
                    left.push(yee);
                }
            }
        );

        if (left.length === 0) {
            return constant;
        }

        return {
            type: "flatadd",
            subtype: "flat",
            expList: left.concat((constant.val != 0 ? [constant] : [])),
        };
    } else if (expression.type === "flatmult") {
        /** @type {Constant} */
        const constant = {
            type: "constant",
            subtype: "single",
            val: 1
        };
        const left = [];

        expression.expList.forEach(
            (exp) => {
                const yee = evaluateArithmetic(exp);

                if (yee.type === "constant") {
                    constant.val *= yee.val;
                } else {
                    left.push(yee);
                }
            }
        );

        if (left.length === 0 || constant.val === 0) {
            return constant;
        }

        return {
            type: "flatmult",
            subtype: "flat",
            expList: (constant.val != 1 ? [constant] : []).concat(left),
        };
    } else if (expression.type === "pow") {
        if (expression.expL.type === "constant" && expression.expR.type === "constant") {
            return {
                type: "constant",
                subtype: "single",
                val: Math.pow(expression.expL.val, expression.expR.val),
            };
        }
    }

    return expression;
}


/**
 * 
 * @param {Expression} expression 
 */
function combineMultiplyTerms(expression) {

    if(expression.subtype === "flat"){
        if(expression.type === "flatmult"){

            const bases = [];
            const exponents = [];

            expression.expList.forEach(
                (exp) => {
                    var base = exp;
                    var pow = {
                        type: "constant",
                        subtype: "single",
                        value: 1
                    };

                    if(exp.type == "pow"){
                        base = exp.expL;
                        pow = exp.expR;
                    }
                    
                    const found = bases.findIndex(
                        (checked) => {
                            return areSame(checked, base);
                        }
                    );

                    if(found == -1){
                        bases.push(base);
                        exponents.push(pow);
                    }else{
                        exponents[found] = {
                            type: "add",
                            subtype: "binary",
                            expL: exponents[found],
                            expR: pow
                        };
                    }
                }
            );

            return {
                type: "flatmult",
                subtype: "flat",
                expList: bases.map(
                    (base, i) => {
                        console.log("fuck, ", Expression.flatten(exponents[i]));
                        return {
                            type: "pow",
                            subtype: "binary",
                            expL: base,
                            expR: simplify(Expression.flatten(exponents[i])),
                        }
                    }
                )
            }
        }
    }

    return expression;
}




/**
 * 
 * @param {Expression} expression 
 */
function combineLikeTerms(expression) {

    if(expression.subtype === "flat"){
        if(expression.type === "flatadd"){
            const coeff = [];
            const factor = [];

            expression.forEach(
                (sub) => {
                    const ind = factor.findIndex(
                        (fact) => {
                            return areAlike(sub, fact);
                        }
                    );

                    if(ind === -1){

                    }else{

                    }
                }
            );
        }
    }

    return expression;
}

/**
 * 
 * @param {Expression} term 
 * @returns {Expression}
 */
function simplifyTerm(term) {

    const coeff = {
        type: "constant",
        subtype: "single",
        val: 1,
    };

    const bases = [];
    const exponents = [];

    term.expList.forEach(element => {
        if (element.type === "constant") {

            coeff.val *= element.val;
        } else {

            var base = element;
            var exp = {
                type: "constant",
                subtype: "single",
                val: 1,
            };

            if (element.type === "pow") {
                base = element.expL;
                exp = element.expR;
            }
            const ind = bases.findIndex(
                (factor) => {
                    return areAlike(factor, base);
                }
            );
            if (ind === -1) {
                bases.push(base);
                exponents.push(exp);
            } else {
                exponents[ind] = {
                    type: "add",
                    subtype: "binary",
                    expL: exp,
                    expR: exponents[ind],
                };
            }

        }


    });

    if (coeff.val !== 1) {
        return {
            type: "flatmult",
            subtype: "flat",
            expList: [coeff].concat(bases.map((term, i) => {

                const simplified = simplify(Expression.flatten(exponents[i]));

                if (simplified.type === "constant") {
                    if (simplified.val === 1) {
                        return term;
                    }
                    if (simplified.val === 0) {
                        return {
                            type: "constant",
                            subtype: "single",
                            val: 1,
                        };
                    }
                }

                return {
                    type: "pow",
                    subtype: "binary",
                    expL: term,
                    expR: simplified,
                };
            })),
        };
    }
    return {
        type: "flatmult",
        subtype: "flat",
        expList: bases.map((term, i) => {
            const simplified = simplify(Expression.flatten(exponents[i]));
            if (simplified.type === "constant") {
                if (simplified.val === 1) {
                    return term;
                }
                if (simplified.val === 0) {
                    return {
                        type: "constant",
                        subtype: "single",
                        val: 1,
                    };
                }
            }

            return {
                type: "pow",
                subtype: "binary",
                expL: term,
                expR: simplified,
            };
        }),
    };
}







/**
 * 
 * @param {Expression} termA 
 * @param {Expression} termB
 * 
 * @returns {Boolean} 
 */
function areSame(termA, termB) {
    const check = termA.type === termB.type;
    if (check) {
        if (termA.type === "flatadd") {
            var b = termB.expList.slice();
            for(var i = 0; i < termA.expList.length; i++){
                const exp = termA.expList[i];
                var j = b.findIndex(
                    (expB) => {
                        return areSame(exp,expB);
                    }
                );
                if(j != -1){
                    b.splice(j,1);
                }else{
                    return false;
                }
            }

            return b.length == 0;
        } else if (termA.type === "constant") {
            return termA.val === termB.val;
        } else if (termA.type === "variable") {
            return termA.name === termB.name;
        }else if(termA.type === "pow"){
            return areSame(termA.expL, termB.expL) && areSame(termA.expR, termB.expR);
        }
    }
    return false;
}









module.exports = {
    simplify: simplify,
};



//const test = "x*x";
//console.log(Expression.prettyPrint(simplify(Expression.getExpression(Expression.getTerms(test)))));
const testA = "x2+x";
const testB = "x+2x";
const testExpA = Expression.getExpression(Expression.getTerms(testA));
const testExpB = Expression.getExpression(Expression.getTerms(testB));
console.log(testExpA);
console.log(testExpB);
console.log(areSame(testExpA, testExpB));