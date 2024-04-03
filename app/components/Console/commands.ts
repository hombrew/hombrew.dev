import type { Terminal } from "./Terminal.client";
import users from "~/config/users.json";

export type Commands =
  | "clear"
  | "resume"
  | "email"
  | "github"
  | "help"
  | "telegram"
  | "test"
  | "twitter"
  | "whoami";

const help = {
  "%whoami%": "summary",
  "%resume%": "go to resume",
  "%email%": "reach out to me",
  "%twitter%": "twitter account",
  "%github%": "all repos",
  "%test%": "do not use",
};

export function getCommands(term: Terminal): Record<Commands, Function> {
  return {
    clear: function () {
      term.init();
    },

    resume: function () {
      term.openURL("https://hombrew.github.io/resume/");
    },

    email: function () {
      term.stylePrint("mmaldonadortiz92@gmail.com");
    },

    github: function () {
      term.openURL("https://github.com/hombrew");
    },

    help: function () {
      const maxCommandLength = Math.max(
        ...Object.keys(help).map((x) => x.length)
      );
      Object.entries(help).forEach(function ([command, description]) {
        if (term.cols >= 80) {
          const rightPad = maxCommandLength - command.length + 2;
          const sep = " ".repeat(rightPad);
          term.stylePrint(`${command}${sep}${description}`);
        } else {
          if (command !== "help") {
            // skip second leading newline
            term.writeln("");
          }
          term.stylePrint(command);
          term.stylePrint(description);
        }
      });
    },

    telegram: function () {
      term.stylePrint("@hombrew");
    },

    test: function () {
      term.openURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    },

    twitter: function () {
      term.openURL("https://twitter.com/hombrew");
    },

    whoami: function (): void {
      const people = Object.keys(users);
      const person = users.hombrew;
      term.stylePrint(`${person.name}`);
      term.stylePrint(`\r\n${person.description}`);
      term.writeln("");
      term.stylePrint(`Current location: ${person.location}`);
    },
  };
}
