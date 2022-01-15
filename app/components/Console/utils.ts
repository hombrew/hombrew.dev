const colors = {
  command: "\x1b[1;35m",
  hyperlink: "\x1b[1;34m",
  // user: "\x1b[1;33m",
  user: "\x1b[1;32m",
  prompt: "\x1b[1;32m",
  default: "",
};

export function colorText(text: string, color: keyof typeof colors) {
  return `${colors[color] || ""}${text}\x1b[0;38m`;
}

function _testWhite(x: string): boolean {
  var white = new RegExp(/^\s$/);
  return white.test(x.charAt(0));
}

// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
// TODO: This doesn't work well at detecting newline
export function _wordWrap(str: string, maxWidth: number): string {
  let newLineStr = "\r\n";
  let res = "";

  while (str.length > maxWidth) {
    let found = false;
    // Inserts new line at first whitespace of the line
    for (let i = maxWidth - 1; i >= 0; i--) {
      if (_testWhite(str.charAt(i))) {
        res = res + [str.slice(0, i), newLineStr].join("");
        str = str.slice(i + 1);
        found = true;
        break;
      }
    }
    // Inserts new line at maxWidth position, the word is too long to wrap
    if (!found) {
      res += [str.slice(0, maxWidth), newLineStr].join("");
      str = str.slice(maxWidth);
    }
  }
  return res + str;
}
