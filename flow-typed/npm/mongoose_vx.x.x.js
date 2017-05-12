declare type mongoose$SchemaDefinition = {}

declare type mongoose$SchemaOptions = {}

declare type mongoose$SchemaType = {}

declare type mongoose$SchemaTypes = {
  ObjectId: mongoose$SchemaType
}

declare class mongoose$Schema<Definition> {
  constructor (definition: mongoose$SchemaDefinition, options: mongoose$SchemaOptions): void;
  static Types: mongoose$SchemaTypes;
  index({ [string]: number }): void
}

declare class mongoose$Mongoose {
  Schema: typeof mongoose$Schema;
  model<Definition>(name: string, schema: mongoose$Schema<Definition>): Class<mongoose$Model<Definition> & Definition>
}

declare class mongoose$Query<Result> {
  exec<X: Result>(): Promise<X>
}

declare class mongoose$ObjectId {
}

declare type mongoose$QueryConditions = {}

declare type mongoose$QueryProjection = {}

declare type mongoose$QueryOptions = {}

declare class mongoose$Model<Definition> {
  constructor(def: Definition): void;
  static find(conditions: mongoose$QueryConditions, projection?: ?mongoose$QueryProjection, options?: ?mongoose$QueryOptions): mongoose$Query<mongoose$Model<Definition>[]>;
  static findById(id: mongoose$ObjectId | string): mongoose$Query<?mongoose$Model<Definition>>;
  _id: mongoose$ObjectId;
  id: string;
  createdAt: Date;
  modifiedAt: Date;
  save(): Promise<mongoose$Model<Definition>>;
  remove(): Promise<*>
}

declare module 'mongoose' {
  declare type QueryConditions = mongoose$QueryConditions
  declare type QueryProjection = mongoose$QueryProjection
  declare type QueryOptions = mongoose$QueryOptions
  declare type ObjectId = mongoose$ObjectId
  declare type Model<Def> = mongoose$Model<Def>
  declare type Schema<Def> = mongoose$Schema<Def>
  declare module.exports: mongoose$Mongoose
}
