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

export type PluginsJSON = {
  [key: string]: SliDeskPlugin;
};

export type SliDeskPlugin = { [key: string]: any };

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
