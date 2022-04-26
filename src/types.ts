export interface OrangebeardOptions {
  token?: string;
  endpoint?: string;
  project?: string;
  testset?: string;
  description?: string;
  attributes?: string;
  debug?: boolean;
}

export interface TestItem {
  id?: string;
  name: string;
  description?: string;
  attributes?: Attribute[];
  status?: STATUSES;
  parentId?: string;
}

export interface Attachment {
  name: string;
  type: MIMETYPES;
  content: string | Buffer;
}

export interface Attribute {
  value: string;
  key?: string;
}

export interface LogItem {
  level?: LOGLEVELS;
  message?: string;
  time?: number;
  file?: Attachment;
}

export enum MIMETYPES {
  XML = "application/xml",
  HTML = "application/html",
  JAVASCRIPT = "application/javascript",
  JSON = "application/json",
  PHP = "application/php",
  CSS = "application/css",
  TEXT = "text/plain",
  PNG = "image/png",
  JPG = "image/jpg",
}

export enum ITEMTYPES {
  SUITE = "SUITE",
  STEP = "STEP",
  TEST = "TEST",
}

export enum CUCUMBERTYPES {
  FEATURE = "feature",
  SCENARIO = "scenario",
}

export enum LOGLEVELS {
  DEBUG = "DEBUG",
  WARN = "WARN",
  INFO = "INFO",
  ERROR = "ERROR",
}

export enum STATUSES {
  FAILED = "failed",
  PASSED = "passed",
  SKIPPED = "skipped",
  STOPPED = "stopped",
  INTERRUPTED = "interrupted",
  CANCELLED = "cancelled",
}
