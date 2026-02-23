"use strict";

module.exports = {
  writeFile: function writeFile(_path, _data, callback) {
    if (typeof callback === "function") {
      callback(new Error("External lp_solve integration is not available in browser builds."));
    }
  },
};
