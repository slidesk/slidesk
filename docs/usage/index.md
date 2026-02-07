# Usage

SliDesk has many options

```sh
slidesk -h
```

will render something like this:

```
 ____(•)<
(SliDesk) v:2.15.1


slidesk 2.15.1
Your presentation companion

Usage: slidesk [options] [arguments]

Subcommands:
 create      tool to help you to instanciate a talk
 plugin      slidesk plugin management
 component   slidesk component management
 link        command to interact with slidesk.link
 template    slidesk template management
 theme       slidesk theme management

Options:
 -h, --help                show help   
 -v, --version             show version   
 -d, --domain <param>      specify a custom domain  (default: localhost) 
 -p, --port <param>        specify a custom port  (default: 1337) 
 -s, --save <param>        save the presentation  (default: public) 
 -n, --notes <param>       open with speakers notes  (default: notes.html) 
 -t, --timers              add checkpoint and slide maximum time on notes view  (default: false) 
 -a, --transition <param>  transition timer  (default: 300) 
 -w, --watch               watch modification of files  (default: false) 
 -g, --hidden              remove help information  (default: false) 
 -c, --conf <param>        use a specific .env file  (default: ) 
 -o, --open                open a browser with the presentation or notes view  (default: false) 
 -l, --lang <param>        specify the language version (per default, it will use the .lang.json file with default information)  (default: ) 
 -x, --terminal            present in a terminal window instead of a browser  (default: false) 
 -y, --deploy <param>      generate a deploy file for 'github', 'gitlab' or 'link' (slidesk.link)  (default: ) 

Arguments:
 talk  directory of your talk
```

We can see that there are several options, that the "talk" consists of a directory (if not specified, SliDesk takes the current directory) and that there is a command to create talks.

As far as options are concerned, the one that will undoubtedly be most frequently used is `-n`, which generates the Speaker view. Coupled with the `-t` option, this will enable you to better manage your time via the checkpoints defined in your presentation, as seen above.

To simplify the call, you can use a simplified syntax:

```sh
slidesk -tn
```

Which combines the `-t` and `-n` options.
