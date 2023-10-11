import { ZodObject, ZodType, ZodOptional, ZodNullable, ZodArray } from 'zod';
import { writeFileSync } from 'fs';

Object.defineProperty(RegExp.prototype, "toJSON", {
    value: RegExp.prototype.toString
});

const typeNameRegex = /"typeName":"(Zod[A-Za-z0-9_]+)"/g;
const stringRegex = /"regex":"\/(.+)\/"/g;

export class ZodCloneStore {
    private readonly store: Map<string, ZodObject<any>> = new Map();
    private readonly generatedPrefix: string;

    constructor(generatedPrefix?: string) {
        this.generatedPrefix = generatedPrefix || "";
    }

    public add<T extends ZodObject<any>>(name: string, schema: T): T {
        this.store.set(name, schema);
        return schema;
    }

    public remove(name: string) {
        this.store.delete(name);
    }

    public clear() {
        this.store.clear();
    }

    public clone(outFile: string) {
        const content = 'import { z } from "zod";\n' + this.generatedPrefix + '\n\n' + Array.from(this.store.entries()).map(([name, schema]) => cloneZodSchema(name, schema)).join('\n');
        writeFileSync(outFile, content);
    }
};

/**
 * Returns a string containing a deeply-nested cloned redefinition of the given schema.
 * @param name The name of the variable that will contain the cloned schema.
 * @param schema The schema to clone.
 */
export const cloneZodSchema = (name: string, schema: ZodObject<any>): string => {
    const cloneZodObject = (obj: ZodType): string => {
        if (obj instanceof ZodObject) {
            const entries = Object.entries(obj.shape);
            return 'z.object({' + entries.map(([key, value]) => `${key}: ${cloneZodObject(value as ZodType)}`).join(',') + '})';
        } else if (obj instanceof ZodOptional) {
            return `z.optional(${cloneZodObject(obj._def.innerType)})`;
        } else if (obj instanceof ZodNullable) {
            return `z.nullable(${cloneZodObject(obj._def.innerType)})`;
        } else if (obj instanceof ZodArray) {
            return `z.array(${cloneZodObject(obj._def.type)})`;
        } else {
            const stringified = `new z.${(obj._def as any).typeName}(${JSON.stringify(obj._def)})`;
            return stringified
                .replace(typeNameRegex, '"typeName":z.ZodFirstPartyTypeKind.$1')
                .replace(stringRegex, '"regex":/$1/')
        }
    };

    return `export const ${name} = ${cloneZodObject(schema)};`;
};