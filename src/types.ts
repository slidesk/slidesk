import type { Server } from "bun";

export type PresentOptions = {
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
};

export type ServerOptions = {
  port?: string;
  domain?: string;
  interactive?: boolean;
  notes?: boolean;
  open?: string;
};

export type CreateOptions = {
  theme?: string;
};

export type PluginsJSON = {
  [key: string]: SliDeskPlugin;
};
export type SlideskPluginAddRoute = (
  req: Request,
  env: object,
  path: string,
) => Promise<Response | null>;

export type SlideskPluginAddWS = (message: string, server: Server) => object;

export type SliDeskPlugin = {
  type?: string;
  addRoutes: string | SlideskPluginAddRoute;
  addWS: string | SlideskPluginAddWS;
  addHTML: string;
  addHTMLFromFiles: string[];
  addScripts: string[];
  addStyles: string[];
  addSpeakerScripts: string[];
  addSpeakerStyles: string[];
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

export type Includes = {
  css: string[];
  js: string[];
};
