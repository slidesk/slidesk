import type { Server, Socket } from "bun";

export type SliDeskPresentOptions = {
  notes?: string;
  hidden?: boolean;
  conf?: string;
  open?: boolean;
  lang?: string;
  telnet?: boolean;
  ip?: string;
};

export type SliDeskSaveOptions = {
  conf?: string;
  lang?: string;
  target?: string;
};

export type SliDeskExportOptions = {
  conf?: string;
  lang?: string;
  type?: string;
  output?: string;
};

export type SliDeskServerOptions = {
  notes?: string;
  open?: boolean;
  ip?: string;
};

export type SliDeskPublishOptions = {
  notes?: string;
  lang?: string;
  "slidesk-link-url"?: string;
};

export type SliDeskSettings = {
  PORT?: number;
  TELNET_PORT?: number;
  HTTPS?: boolean;
  DOMAIN?: string;
  TITLE?: string;
  TRANSITION?: number;
  COMMON_DIR?: string;
  KEY?: string;
  CERT?: string;
  PASSPHRASE?: string;
  WATCH?: boolean;
  WIDTH?: number;
  deployed?: boolean;
};

/** Content of slidesk.toml; any other section is exposed to the talk as is. */
export type SliDeskEnv = {
  slidesk?: SliDeskSettings;
  [section: string]: unknown;
};

export type SliDeskPluginAddRoute = (
  req: Request,
  env: SliDeskEnv,
  path: string,
) => Promise<Response | null>;

/** Attached to each websocket: only the speaker's own pages may drive the talk. */
export type SliDeskSocketData = { canSend: boolean };

export type SliDeskPluginAddWS = (
  _message: string,
  _server: Server<SliDeskSocketData>,
  /** canSend: the message comes from the speaker, who may drive the talk */
  _socket: SliDeskSocketData,
) => Promise<object>;

/** A plugin.json as read from disk, plus the name of its folder. */
export type SliDeskPlugin = {
  name: string;
  type?: string;
  addRoutes?: string;
  addWS?: string;
  addHTML?: string;
  addHTMLFromFiles?: string[] | Record<string, string>;
  addScripts?: string[];
  addStyles?: string[];
  addSpeakerScripts?: string[];
  addSpeakerStyles?: string[];
  onSlideChange?: string;
  onSpeakerViewSlideChange?: string;
  addScriptModules?: string[];
  theme?: string;
};

/** A plugin whose server hooks have been imported. */
export type SliDeskServerPlugin = {
  name: string;
  addRoutes?: SliDeskPluginAddRoute;
  addWS?: SliDeskPluginAddWS;
};

export type SliDeskFile = {
  [key: string]: {
    headers?: Record<string, string>;
    content?: string | Uint8Array<ArrayBuffer>;
  };
};

export type SliDeskTemplate = Record<string, string>;

export type SliDeskConfig = { css: string[]; js: string[] };

export type SliDeskFavicon = {
  name: string;
  content: string | Uint8Array<ArrayBuffer>;
  type: string;
};

export interface SliDeskTelnetSlidesConfig {
  port?: number;
  totalSlides?: number | null;
  slides: string[];
}

export interface SliDeskTelnetSession {
  currentSlide: number;
  totalSlides: number;
  rows: number;
  cols: number;
  loading: boolean;
  started: boolean;
  config: Required<SliDeskTelnetSlidesConfig>;
  /** digits typed so far, the slide Enter goes to */
  typed?: string;
}

export type BunSocket = Socket;
