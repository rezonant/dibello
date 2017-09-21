import { SchemaBuilder } from './schema-builder';

export interface Schema {
    version: number;
    migrations: { [ version : string ] : (schema : SchemaBuilder) => void }
}
  