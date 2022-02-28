type NumberRange = [start: number, end: number]

const units = [
    "dl",
    "tsp|tl|teaspoon|teaspoons",
    "tbsp|Tbsp|tablespoon|rkl",
    "g",
    "prk",
    "cup|cups",
    "ml",
    "lb\\.", // TODO: Make dot optional
    "oz",
    "pound",
    "in\\." // TODO: Make dot optional
]

const substitutions: { [key: string]: string } = {
    "½": "0.5",
    "1/2": "0.5",
    "¼": "0.25",
    "1/4": "0.25",
    "¾": "0.75",
    "3/4": "0.75"
}

interface IngredientAmount {
    amount: number | NumberRange,
    unit: string
}

interface IngredientSlice {
    textSlice: NumberRange,
    ingredient: IngredientAmount
}

const parseParts = (ingredient: string): IngredientSlice[] => {
    /*
        Regex explained:
        1. Amount starts with 1 or more digits, and is optionally followed by a decimal part with a dot as a separator (TODO: Implement support for commas)
        2. Check if it's a range (like "3-4 dl of water"). It's a range if it starts with a dash (-) and is followed by a number (same requirements as previously)
        3. Check for the unit
        4. Make sure that it ends with something other than a letter (this prevents cases where "4 garlics" is treated as 4 grams, because it starts with "4 g")
    */
    const amountRegex = new RegExp(`(\\d+\\.?\\d*(?:\\s*-\\s*\\d+)?)\\s*(${units.join("|")})(?=\\s*[^a-zA-Z]|$)`, "g")

    const all = Array.from(ingredient.matchAll(amountRegex));
    if (all.length === 0) return [];

    const numbers: IngredientSlice[] = all.map(a => {
        const isRange = a[0].includes("-");
        const startIndex = a.index === undefined ? -1 : a.index;
        const textSlice: NumberRange = [startIndex, startIndex + a[0].length];
        if (isRange) {
            const [startStr, endStr] = a[1].trim().split("-").map(p => p.trim());
            return {
                ingredient: {
                    amount: [Number(startStr), Number(endStr)],
                    unit: a[2]
                },
                textSlice
            }
        }
        else {
            return {
                ingredient: {
                    amount: Number(a[1]),
                    unit: a[2]
                },
                textSlice
            }
        }
    });

    return numbers;
}

export const getTokens = (ingredient: string) => {
    let transformedIngredient = ingredient;

    Object.keys(substitutions).forEach(substitution => {
        const matches = transformedIngredient.match(new RegExp(`(${substitution})`, "g"));
        if (matches) {
            matches.forEach(m => {
                const dec: string = substitutions[substitution];
                const withDecimals = m.replace(/\s+/g, " ").replace(substitution, String(dec));
                const sum = withDecimals.split(" ").reduce((prev, curr) => prev + Number(curr), 0);
                transformedIngredient = transformedIngredient.replace(m, String(sum));
            })
        }
    });

    return {
        ingredient,
        transformedIngredient,
        amounts: parseParts(transformedIngredient)
    }
}

export const tokenizeIngredient = (ingredient: string) => {
    const tokens = getTokens(ingredient)
    const splits = tokens.amounts.reduce<number[]>((prev, curr) => [...prev, curr.textSlice[0], curr.textSlice[1]], []).filter(s => s !== tokens.transformedIngredient.length)

    const chunks = Array.from(tokens.transformedIngredient).reduceRight<string[][]>((result, value, index) => {
        result[0] = result[0] || [];

        if (splits.includes(index + 1)) {
            result.unshift([value]);
        } else {
            result[0].unshift(value);
        }

        return result;
    }, []);

    let runningIndex = 0;
    const chunksWithMetadata = chunks.map(c => c.join("")).map(c => {
        const res = {
            text: c,
            token: tokens.amounts.find(a => a.textSlice[0] <= runningIndex && runningIndex < a.textSlice[1])
        }
        runningIndex += c.length;
        return res;
    })

    return chunksWithMetadata;
}