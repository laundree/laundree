// flow-typed signature: 0a6a6906c197a7b95b251a16f7064bee
// flow-typed version: f471f20d31/express_v4.x.x/flow_>=v0.32.x

import type { Server } from 'http';

declare type express$RouterOptions = {
  caseSensitive?: boolean,
  mergeParams?: boolean,
  strict?: boolean
};

declare class express$RequestResponseBase<Req, Res> {
  app: express$Application<Req, Res>;
  get(field: string): string | void;
}

declare class express$Request<Req, Res> extends http$IncomingMessage mixins express$RequestResponseBase<Req, Res> {
  baseUrl: string;
  body: any;
  cookies: {[cookie: string]: string};
  fresh: boolean;
  hostname: string;
  ip: string;
  ips: Array<string>;
  method: string;
  originalUrl: string;
  params: {[param: string]: string};
  path: string;
  protocol: 'https' | 'http';
  query: {[name: string]: string};
  route: string;
  secure: boolean;
  signedCookies: {[signedCookie: string]: string};
  stale: boolean;
  subdomains: Array<string>;
  xhr: boolean;
  accepts(types: string): string | false;
  acceptsCharsets(...charsets: Array<string>): string | false;
  acceptsEncodings(...encoding: Array<string>): string | false;
  acceptsLanguages(...lang: Array<string>): string | false;
  header(field: string): string | void;
  is(type: string): boolean;
  param(name: string, defaultValue?: string): string | void;
}

declare type express$CookieOptions = {
  domain?: string,
  encode?: (value: string) => string,
  expires?: Date,
  httpOnly?: boolean,
  maxAge?: number,
  path?: string,
  secure?: boolean,
  signed?: boolean
};

declare type express$RenderCallback = (err: Error | null, html?: string) => mixed;

declare type express$SendFileOptions = {
  maxAge?: number,
  root?: string,
  lastModified?: boolean,
  headers?: {[name: string]: string},
  dotfiles?: 'allow' | 'deny' | 'ignore'
};

declare class express$Response<Req, Res> extends http$ServerResponse mixins express$RequestResponseBase<Req, Res> {
  headersSent: boolean;
  locals: {[name: string]: mixed};
  append(field: string, value?: string): this;
  attachment(filename?: string): this;
  cookie(name: string, value: string, options?: express$CookieOptions): this;
  clearCookie(name: string, options?: express$CookieOptions): this;
  download(path: string, filename?: string, callback?: (err?: ?Error) => void): this;
  format(typesObject: {[type: string]: Function}): this;
  json(body?: mixed): this;
  jsonp(body?: mixed): this;
  links(links: {[name: string]: string}): this;
  location(path: string): this;
  redirect(url: string, ...args: Array<void>): this;
  redirect(status: number, url: string, ...args: Array<void>): this;
  render(view: string, locals?: {[name: string]: mixed}, callback?: express$RenderCallback): this;
  send(body?: mixed): this;
  sendFile(path: string, options?: express$SendFileOptions, callback?: (err?: ?Error) => mixed): this;
  sendStatus(statusCode: number): this;
  header(field: string, value?: string): this;
  header(headers: {[name: string]: string}): this;
  set(field: string, value?: string|string[]): this;
  set(headers: {[name: string]: string}): this;
  status(statusCode: number): this;
  type(type: string): this;
  vary(field: string): this;
}

declare type express$NextFunction = (err?: ?Error | 'route') => mixed;
declare type express$Middleware<Req: {}, Res: {}> =
  ((req: express$Request<Req, Res> & Req, res: express$Response<Req, Res> & Res, next: express$NextFunction) => mixed) |
  ((error: Error, req: express$Request<Req, Res> & Req, res: express$Response<Req, Res> & Res, next: express$NextFunction) => mixed);
declare interface express$RouteMethodType<T, Req, Res> {
  (middleware: express$Middleware<Req, Res>): T;
  (...middleware: Array<express$Middleware<Req, Res>>): T;
  (path: string|RegExp|string[], ...middleware: Array<express$Middleware<Req, Res>>): T;
}
declare class express$Route<Req, Res> {
  all: express$RouteMethodType<this, Req, Res>;
  get: express$RouteMethodType<this, Req, Res>;
  post: express$RouteMethodType<this, Req, Res>;
  put: express$RouteMethodType<this, Req, Res>;
  head: express$RouteMethodType<this, Req, Res>;
  delete: express$RouteMethodType<this, Req, Res>;
  options: express$RouteMethodType<this, Req, Res>;
  trace: express$RouteMethodType<this, Req, Res>;
  copy: express$RouteMethodType<this, Req, Res>;
  lock: express$RouteMethodType<this, Req, Res>;
  mkcol: express$RouteMethodType<this, Req, Res>;
  move: express$RouteMethodType<this, Req, Res>;
  purge: express$RouteMethodType<this, Req, Res>;
  propfind: express$RouteMethodType<this, Req, Res>;
  proppatch: express$RouteMethodType<this, Req, Res>;
  unlock: express$RouteMethodType<this, Req, Res>;
  report: express$RouteMethodType<this, Req, Res>;
  mkactivity: express$RouteMethodType<this, Req, Res>;
  checkout: express$RouteMethodType<this, Req, Res>;
  merge: express$RouteMethodType<this, Req, Res>;

  // @TODO Missing 'm-search' but get flow illegal name error.

  notify: express$RouteMethodType<this, Req, Res>;
  subscribe: express$RouteMethodType<this, Req, Res>;
  unsubscribe: express$RouteMethodType<this, Req, Res>;
  patch: express$RouteMethodType<this, Req, Res>;
  search: express$RouteMethodType<this, Req, Res>;
  connect: express$RouteMethodType<this, Req, Res>;
}

declare class express$Router<Req, Res> extends express$Route<Req, Res> {
  constructor(options?: express$RouterOptions): void;
  route(path: string): express$Route<Req, Res>;
  static <Req, Res>(): express$Router<Req, Res>;
  use(middleware: express$Middleware<Req, Res>): this;
  use(...middleware: Array<express$Middleware<Req, Res>>): this;
  use(path: string|RegExp|string[], ...middleware: Array<express$Middleware<Req, Res>>): this;
  use(path: string, router: express$Router<Req, Res>): this;
  handle(req: http$IncomingMessage, res: http$ServerResponse, next: express$NextFunction): void;

  // Can't use regular callable signature syntax due to https://github.com/facebook/flow/issues/3084
  $call: (req: http$IncomingMessage, res: http$ServerResponse, next?: ?express$NextFunction) => void;
}

declare class express$Application<Req, Res> extends express$Router<Req, Res> mixins events$EventEmitter {
  constructor(): void;
  locals: {[name: string]: mixed};
  mountpath: string;
  listen(port: number, hostname?: string, backlog?: number, callback?: (err?: ?Error) => mixed): Server;
  listen(port: number, hostname?: string, callback?: (err?: ?Error) => mixed): Server;
  listen(port: number, callback?: (err?: ?Error) => mixed): Server;
  listen(path: string, callback?: (err?: ?Error) => mixed): Server;
  listen(handle: Object, callback?: (err?: ?Error) => mixed): Server;
  disable(name: string): void;
  disabled(name: string): boolean;
  enable(name: string): void;
  enabled(name: string): boolean;
  engine(name: string, callback: Function): void;
  /**
   * Mixed will not be taken as a value option. Issue around using the GET http method name and the get for settings.
   */
  //   get(name: string): mixed;
  set(name: string, value: mixed): mixed;
  render(name: string, optionsOrFunction: {[name: string]: mixed}, callback: express$RenderCallback): void;
  handle(req: http$IncomingMessage, res: http$ServerResponse, next?: ?express$NextFunction): void;
}

declare module 'express' {
  declare function serveStatic<Req, Res>(root: string, options?: Object): express$Middleware<Req, Res>;

  declare type RouterOptions = express$RouterOptions;
  declare type CookieOptions = express$CookieOptions;
  declare type Middleware<Req, Res> = express$Middleware<Req, Res>;
  declare type NextFunction = express$NextFunction;
  declare type Response<Req, Res> = express$Response<Req, Res>;
  declare type Request<Req, Res> = express$Request<Req, Res>;
  declare type Application<Req, Res> = express$Application<Req, Res>;
  declare type Router<Req, Res> = express$Router<Req, Res>
  declare module.exports: {
    <Req, Res>(): express$Application<Req, Res>, // If you try to call like a function, it will use this signature
    static: serveStatic<*,*>, // `static` property on the function
    Router: typeof express$Router, // `Router` property on the function
  };
}
