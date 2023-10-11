# zod-clone
Generates deeply cloned definitions of Zod schemas.

# Installation
Available as a npm package:
```
npm install --save-dev zod-clone
```

# Usage
Given Zod schemas, creates a string containing a verbose redefinition of the given schema. Useful for getting rid of dependencies when exporting inferred schemas.

One can get the definition directly using `cloneZodSchema()` directly, or by adding all the schemas to be cloned to a `ZodCloneStore`, then writing them to an output file for later use. For instance, take this integration using `drizzle-orm` and `drizzle-zod`:

```
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { ZodCloneStore, cloneZodSchema } from "zod-clone";

const cloneStore = new ZodCloneStore();

const table = pgTable("table", {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
});

const schema = cloneStore.add('schema', createSelectSchema(table));

cloneStore.clone('./generated.ts');

// Same output as the generated .ts file, but only for a single schema
console.log(cloneZodSchema('schema', schema));
```

The generated file `generated.ts` will contain:
```
import { z } from "zod";

export const schema = z.object({
    id: new z.ZodString({ checks: [{ kind: "uuid" }], typeName: z.ZodFirstPartyTypeKind.ZodString, coerce: false }),
    name: new z.ZodString({ checks: [], typeName: z.ZodFirstPartyTypeKind.ZodString, coerce: false }),
    timestamp: new z.ZodDate({ checks: [], coerce: false, typeName: z.ZodFirstPartyTypeKind.ZodDate }),
});
```

Note that the generated file no longer depends on `drizzle-orm` or `drizzle-zod`, but contains all the inferred logic.

# License
Made by Marko Calasan, 2023.

This product is licensed under the MIT License.
