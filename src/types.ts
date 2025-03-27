import type { Server } from "bun";

export type SliDeskPresentOptions = {
  domain?: string;
  port?: string;
  save?: string;
  notes?: boolean;
  timers?: boolean;
  transition?: string;
  watch?: boolean;
  hidden?: boolean;
  conf?: string;
  interactive?: boolean;
  open?: string;
  lang?: string;
  terminal?: boolean;
};

export type SliDeskServerOptions = {
  port?: string;
  domain?: string;
  interactive?: boolean;
  notes?: boolean;
  open?: string;
};

export type SliDeskCreateOptions = {
  theme?: string;
};

export type SliDeskPluginAddRoute = (
  req: Request,
  env: object,
  path: string,
) => Promise<Response | null>;

export type SliDeskPluginAddWS = (
  _message: string,
  _server: Server,
) => Promise<object>;

export type SliDeskPlugin = {
  name: string;
  type?: string;
  addRoutes: string | SliDeskPluginAddRoute;
  addWS: string | SliDeskPluginAddWS;
  addHTML: string;
  addHTMLFromFiles: string[] | { [key: string]: string };
  addScripts: string[] | { [key: string]: string };
  addStyles: string[] | { [key: string]: string };
  addSpeakerScripts: string[] | { [key: string]: string };
  addSpeakerStyles: string[] | { [key: string]: string };
  onSlideChange: string;
  onSpeakerViewSlideChange: string;
};

export type SliDeskFile = {
  [key: string]: {
    headers?: {
      [key: string]: string;
    };
    content?: string;
  };
};

export type SliDeskTemplate = {
  [key: string]: string;
};

export type SliDeskConfig = {
  customCSS: string;
  customIncludes: { css: string[]; js: string[] };
};

export type SliDeskFavicon = {
  name: string;
  content: string | Uint8Array;
  type: string;
};
