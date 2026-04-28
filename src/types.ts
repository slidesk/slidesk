import type { Server, WebSocket } from "bun";

export type SliDeskPresentOptions = {
  notes?: string;
  hidden?: boolean;
  conf?: string;
  open?: string;
  lang?: string;
  telnet?: boolean;
  ip?: string;
};

export type SliDeskSaveOptions = {
  conf?: string;
  lang?: string;
  target?: string;
};

export type SliDeskServerOptions = {
  notes?: string;
  open?: string;
  ip?: string;
};

export type SliDeskPublishOptions = {
  notes?: string;
  lang?: string;
  "slidesk-link-url"?: string;
};

export type SliDeskPluginAddRoute = (
  req: Request,
  env: object,
  path: string,
) => Promise<Response | null>;

export type SliDeskPluginAddWS = (
  _message: string,
  _server: Server<WebSocket>,
) => Promise<object>;

export type SliDeskPlugin = {
  name: string;
  type?: string;
  addRoutes: string | SliDeskPluginAddRoute;
  addWS: string | SliDeskPluginAddWS;
  addHTML: string;
  addHTMLFromFiles: string[] | Record<string, string>;
  addScripts: string[] | Record<string, string>;
  addStyles: string[] | Record<string, string>;
  addSpeakerScripts: string[] | Record<string, string>;
  addSpeakerStyles: string[] | Record<string, string>;
  onSlideChange: string;
  onSpeakerViewSlideChange: string;
  addScriptModules?: string[] | Record<string, string>;
  theme: string;
};

export type SliDeskFile = {
  [key: string]: {
    headers?: Record<string, string>;
    content?: string;
  };
};

export type SliDeskTemplate = Record<string, string>;

export type SliDeskConfig = { css: string[]; js: string[] };

export type SliDeskFavicon = {
  name: string;
  content: string | Uint8Array;
  type: string;
};

export interface SliDeskTelnetSlidesConfig {
  port?: number;
  totalSlides?: number | null;
  slides: string[];
}

export type SliDeskTelnetTransition =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "wipe";

export interface SliDeskTelnetSession {
  currentSlide: number;
  totalSlides: number;
  rows: number;
  cols: number;
  loading: boolean;
  started: boolean;
  config: Required<SliDeskTelnetSlidesConfig>;
}

import type { Socket } from "bun";
export type BunSocket = Socket;
