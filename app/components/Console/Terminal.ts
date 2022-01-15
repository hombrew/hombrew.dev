import { Terminal as BaseTerminal } from "xterm";
import type { ITerminalOptions } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { _wordWrap, colorText, getCommands, logo } from "./common.client";
import type { Commands } from "./common.client";
import { TERMINAL_MAX_WIDTH } from "~/config/constants";

type DataLayerItem = {
  event: "commandSent";
  command: Commands;
  args: string;
};

export class Terminal extends BaseTerminal {
  currentLine: string = "";
  dataLayer: DataLayerItem[] = [];
  user: string = "guest";
  host: string = "manuel.maldonado";
  cwd: string = "~";
  sep: string = "@";
  _promptChar: string = "$";
  _initialized: boolean = false;
  history: string[] = [];
  historyCursor: number = -1;
  deepLink: string = window.location.hash.replace("#", "").split("-").join(" ");
  commands = getCommands(this);
  fitAddon: FitAddon = new FitAddon();

  constructor(options?: ITerminalOptions) {
    super(options);
    const webLinksAddon = new WebLinksAddon();
    this.loadAddon(this.fitAddon);
    this.loadAddon(webLinksAddon);
  }

  pos(): number {
    // @ts-ignore
    return this._core.buffer.x - this.promptRawText().length - 1;
  }

  private promptRawText(): string {
    return `${this.user}${this.sep}${this.host} ${this.cwd} $`;
  }

  private promptText(): string {
    return this.promptRawText()
      .replace(this.user, colorText(this.user, "user"))
      .replace(this.sep, colorText(this.sep, "default"))
      .replace(this.host, colorText(this.host, "prompt"))
      .replace(this.cwd, colorText(this.cwd, "default"))
      .replace(this._promptChar, colorText(this._promptChar, "prompt"));
  }

  prompt(prefix = "\r\n", suffix = " "): void {
    this.write(`${prefix}${this.promptText()}${suffix}`);
  }

  clearCurrentLine(goToEndofHistory: boolean = false) {
    this.write("\x1b[2K\r");
    this.prompt("", " ");
    this.currentLine = "";

    if (goToEndofHistory) {
      this.historyCursor = -1;
      this.scrollToBottom();
    }
  }

  setCurrentLine(newLine: string, preserveCursor = false) {
    const length = this.currentLine.length;
    this.clearCurrentLine();
    this.currentLine = newLine;
    this.write(newLine);

    if (preserveCursor) {
      this.write("\x1b[D".repeat(length - this.pos()));
    }
  }

  stylePrint = (text: string, wrap = true) => {
    // Hyperlinks
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urlMatches = text.matchAll(urlRegex);
    let allowWrapping = true;
    for (const match of urlMatches) {
      allowWrapping = match[0].length < TERMINAL_MAX_WIDTH;
      text = text.replace(match[0], colorText(match[0], "hyperlink"));
    }

    // Text Wrap
    if (allowWrapping && wrap) {
      text = _wordWrap(text, Math.min(this.cols, TERMINAL_MAX_WIDTH));
    }

    // Commands
    const commands = Object.keys(this.commands);
    for (const command of commands) {
      const cmdMatches = text.matchAll(new RegExp(`%${command}%`, "g"));
      for (const match of cmdMatches) {
        text = text.replace(match[0], colorText(command, "command"));
      }
    }

    this.writeln(text);
  };

  // printArt = (id) => {
  //   if (term.cols >= 40) {
  //     term.writeln(`\r\n${getArt(id)}\r\n`);
  //   }
  // }

  printLogoType(): void {
    this.writeln(
      colorText(this.cols >= 102 ? logo : "[Manuel Maldonado]\r\n", "prompt")
    );
  }

  openURL = (url: string, newWindow = true) => {
    this.stylePrint(`Opening ${url}`);

    if (this._initialized && newWindow) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  displayURL(url: string) {
    this.stylePrint(colorText(url, "hyperlink"));
  }

  command(line: string) {
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase() as Commands;
    const args = parts.slice(1, parts.length);
    const fn = this.commands[cmd];
    if (typeof fn === "undefined") {
      this.stylePrint(`Command not found: ${cmd}. Try 'help' to get started.`);
    } else {
      return fn(args);
    }
  }

  resizeListener() {
    this._initialized = false;
    this.init(this.user, true);
    this.runDeepLink();

    for (const line of this.history) {
      this.prompt("\r\n", ` ${line}\r\n`);
      this.command(line);
    }
    this.prompt();
    this.scrollToBottom();
    this._initialized = true;
  }

  init(user = "guest", preserveHistory = false): void {
    this.fitAddon.fit();
    // preloadASCIIArt();
    // preloadFiles();
    this.reset();
    this.printLogoType();
    this.stylePrint("Welcome to the Matrix");
    this.stylePrint(
      `Type ${colorText("help", "command")} to get started.`,
      false
    );

    this.user = user;
    if (!preserveHistory) {
      this.history = [];
    }
    this.focus();
  }

  runDeepLink(): void {
    if (this.deepLink !== "") {
      this.command(this.deepLink);
    }
  }

  runTerminal(): void {
    if (this._initialized) {
      return;
    }

    this.init();
    this._initialized = true;
    this.runDeepLink();
    this.prompt();

    this.onData((e) => {
      if (this._initialized) {
        switch (e) {
          case "\r": // Enter
            this.writeln("");
            var status;

            if (this.currentLine.length > 0) {
              this.history.push(this.currentLine);
              this.currentLine = this.currentLine.trim();
              status = this.command(this.currentLine);

              const tokens = this.currentLine.split(" ");
              const cmd = tokens.shift() as Commands;
              const args = tokens.join(" ");
              this.dataLayer.push({
                event: "commandSent",
                command: cmd,
                args: args,
              });
            }

            if (status != 1) {
              this.prompt();
              this.clearCurrentLine(true);
            }
            break;
          case "\u0001": // Ctrl+A
            this.write("\x1b[D".repeat(this.pos()));
            break;
          case "\u0005": // Ctrl+E
            if (this.pos() < this.currentLine.length) {
              this.write("\x1b[C".repeat(this.currentLine.length - this.pos()));
            }
            break;
          case "\u0003": // Ctrl+C
            this.prompt();
            this.clearCurrentLine(true);
            break;
          case "\u0008": // Ctrl+H
          case "\u007F": // Backspace (DEL)
            // Do not delete the prompt
            if (this.pos() > 0) {
              const newLine =
                this.currentLine.slice(0, this.pos() - 1) +
                this.currentLine.slice(this.pos());
              this.setCurrentLine(newLine, true);
            }
            break;
          case "\u{1b}[A": // up
            var h = [...this.history].reverse();
            if (this.historyCursor < h.length - 1) {
              this.historyCursor += 1;
              this.setCurrentLine(h[this.historyCursor], false);
            }
            break;
          case "\u{1b}[B": // down
            var h = [...this.history].reverse();
            if (this.historyCursor > 0) {
              this.historyCursor -= 1;
              this.setCurrentLine(h[this.historyCursor], false);
            } else {
              this.clearCurrentLine(true);
            }
            break;
          case "\u{1b}[C": // right
            if (this.pos() < this.currentLine.length) {
              this.write("\x1b[C");
            }
            break;
          case "\u{1b}[D": // left
            if (this.pos() > 0) {
              this.write("\x1b[D");
            }
            break;
          // case '\t': // tab
          //   const cmd = term.currentLine.split(" ")[0];
          //   const rest = term.currentLine.slice(cmd.length).trim();
          //   const autocompleteCmds = Object.keys(term.commands).filter((c) => c.startsWith(cmd));
          //   var autocompleteArgs;

          //   // detect what to autocomplete
          //   if (autocompleteCmds && autocompleteCmds.length > 1) {
          //     const oldLine = term.currentLine;
          //     term.stylePrint(`\r\n${autocompleteCmds.sort().join("   ")}`);
          //     term.prompt();
          //     term.setCurrentLine(oldLine);
          //   } else if (["cat", "tail", "less", "head", "open", "mv", "cp", "chown", "chmod"].includes(cmd)) {
          //     autocompleteArgs = _filesHere().filter((f) => f.startsWith(rest));
          //   } else if (["whois", "finger", "groups"].includes(cmd)) {
          //     autocompleteArgs = Object.keys(team).filter((f) => f.startsWith(rest));
          //   } else if (["man", "woman", "cv"].includes(cmd)) {
          //     autocompleteArgs = Object.keys(cv).filter((f) => f.startsWith(rest));
          //   } else if (["cd"].includes(cmd)) {
          //     autocompleteArgs = _filesHere().filter((dir) => dir.startsWith(rest) && !_DIRS[term.cwd].includes(dir));
          //   }

          //   // do the autocompleting
          //   if (autocompleteArgs && autocompleteArgs.length > 1) {
          //     const oldLine = term.currentLine;
          //     term.writeln(`\r\n${autocompleteArgs.join("   ")}`);
          //     term.prompt();
          //     term.setCurrentLine(oldLine);
          //   } else if (term.commands[cmd] && autocompleteArgs && autocompleteArgs.length > 0) {
          //     term.setCurrentLine(`${cmd} ${autocompleteArgs[0]}`);
          //   } else if (term.commands[cmd] && autocompleteArgs && autocompleteArgs.length == 0) {
          //     term.setCurrentLine(`${cmd} ${rest}`);
          //   } else if (autocompleteCmds && autocompleteCmds.length == 1) {
          //     term.setCurrentLine(`${autocompleteCmds[0]} `);
          //   }
          //   break;
          default:
            // Print all other characters
            const newLine = `${this.currentLine.slice(
              0,
              this.pos()
            )}${e}${this.currentLine.slice(this.pos())}`;
            this.setCurrentLine(newLine, true);
            break;
        }
        this.scrollToBottom();
      }
    });
  }
}
