const path = module.require('node:path');

for (const extension of ['.png', '.jpg', '.jpeg', '.svg']) {
  require.extensions[extension] = (module, filename) => {
    module.exports = path.resolve(filename);
  };
}