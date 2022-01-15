import { Terminal } from "./common.client";
import users from "~/config/users.json";
import cv from "~/config/cv.json";
import { TERMINAL_MAX_WIDTH } from "~/config/constants";

export type Commands =
  | "clear"
  | "cv"
  | "email"
  | "github"
  | "help"
  | "telegram"
  | "test"
  | "twitter"
  | "whois";

const help = {
  "%whois%": "list all users",
  "%whois% [user]": "learn about us",
  "%cv%": "list all cv companies",
  "%cv% [company_name]": "learn about a cv company",
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

    cv: function ([name]: [string] = [""]) {
      if (!name) {
        const companies = Object.keys(cv);
        term.stylePrint("%cv%: Learn about a cv company - usage:\r\n");
        for (const company of companies) {
          const data = cv[company as keyof typeof cv];
          const sep = term.cols >= TERMINAL_MAX_WIDTH ? "\t" : "\r\n";
          term.stylePrint(`%cv% ${company}${sep}${data.url}`);
          if (
            term.cols < TERMINAL_MAX_WIDTH &&
            company !== companies[companies.length - 1]
          ) {
            term.writeln("");
          }
        }

        return;
      }

      if (!cv[name as keyof typeof cv]) {
        term.stylePrint(
          `cv company ${name} not found. Should I talk to them? Email me: mmaldonadortiz92@gmail.com`
        );

        return;
      }

      const company = cv[name as keyof typeof cv];
      term.stylePrint(company["name"]);
      term.stylePrint(company["url"]);
      term.stylePrint("");
      term.stylePrint(company["description"]);
      if (company["contribution"]) {
        term.stylePrint("\r\nHow I contributed:");
        company["contribution"].forEach((contribution) => {
          term.writeln("");
          term.stylePrint(`- ${contribution}`);
        });
      }
    },

    email: function () {
      term.openURL("mailto:mmaldonadortiz92@gmail.com");
    },

    github: function () {
      term.displayURL("https://github.com/hombrew");
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
      term.displayURL("https://twitter.com/hombrew");
    },

    whois: function ([name]: [string]): void {
      const people = Object.keys(users);

      if (!name) {
        term.stylePrint("%whois%: Learn about us - usage:\r\n");
        for (const person of people) {
          term.stylePrint(`%whois% ${person}`);
        }
        return;
      }

      if (!people.includes(name)) {
        term.stylePrint(`User ${name || ""} not found. Try:\r\n`);
        for (const person of people) {
          term.stylePrint(`%whois% ${person}`);
        }
        return;
      }

      const person = users[name as keyof typeof users];
      term.stylePrint(`${person.name}`);
      term.stylePrint(`\r\n${person.description}`);
      term.writeln("");
      term.stylePrint(`Current location: ${person.location}`);
    },
  };
}
