module.exports = ({
  html = '',
  css = '',
  scripts,
  title,
  meta = [],
  links = [],
  static: staticBuild,
}) => `<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<meta name='generator' content='Compositor x0'>
<title>${title}</title>
${meta
  .map(({ name, content }) => `<meta name='${name}' content='${content}'>`)
  .join('\n')}
${links
  .map(({ rel, href }) => `<link rel='${rel}' href='${href}' />`)
  .join('\n')}
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif}</style>
${css}
</head>
<body>
  <div id="root">${html}</div>
  ${staticBuild ? '' : scripts}
</body>
</html>`;
