
/**
 * 
 * @param {Object} obj Object to be validated against the schema
 * @param {any} schema Schema to validate against
 * @returns {value: *, error: Object[], isInvalid: boolean}
 */
export const schemaValidator = (obj: any, schema: any) => {
    const { value, error: rawError } = schema.validate(obj, { abortEarly: false });
    let error = {};

    if (rawError) {
        error = rawError.details.reduce((acc: any, curr: any) => {
            acc[curr.path[0]] = curr.message.replace(`"${curr.path[0]}"`, "This field");
            return acc;
        }, {})
    }

    return {
        value,
        error,
        isInvalid: !!rawError
    }
}