/**
 * Utility Class for configuration parsing
 */

export default abstract class ConfigValidator {
    static validateConfigValueByRule<E>(providedValue: any, rule: ConfigRule) {
        try {
            if (!providedValue && !rule.optional) return { success: false };
            switch (rule.type) {
                case 'number':
                    const parsedNumber = parseFloat(providedValue);
                    return { success: typeof parsedNumber === 'number', value: parsedNumber };
                case 'string':
                    return { success: typeof providedValue === 'string', value: providedValue };
                case 'boolean':
                    const value = providedValue === 'true' ? true : providedValue === 'false' ? false : null;
                    return { success: value !== null, value };

            }
        } catch (e) {
            return { success: false };
        }
    }

    /**
     * Checks parsed configuration value types and parses configuration based on value type
     * @param parsed Parsed configuration as parsed by dotenv
     * @param expected expected configuration object
     */
    static validateAndParseConfigWithExpectedConfig<E, C>(parsed: any, expected: E) {
        if (!parsed) throw new Error('Parsed config is invalid');
        const configuration = Object.keys(expected).reduce((conf, k) => {
            const parsedValue = parsed[k];
            const rule: any = expected[k as keyof E];

            if (!rule || !rule.type) throw new Error(`Unexpected config rule for key ${k}`);

            const validateResponse = ConfigValidator.validateConfigValueByRule(parsedValue, rule as ConfigRule);
            if (!validateResponse || !validateResponse.success) throw new Error(`${k} is invalid. Expected: ${JSON.stringify(rule)}`);
            conf[k as keyof C] = validateResponse.value;
            return conf;
        }, {} as C);

        return configuration;
    }
}

interface ConfigRule {
    type: 'boolean' | 'number' | 'string';
    optional?: boolean;
}


/**
 * Extracts config types from expected configuration object.
 */
export type MappedConfigType<I, K extends keyof I, V extends I[K] & {type: string, optional?: boolean }> = V['type'] extends  'number' ?  number :
  V['type'] extends 'string' ? string :
  V['type'] extends 'boolean' ? boolean : never;
