"use strict";

module.exports = {
  execFile: function execFile() {
    throw new Error("External lp_solve integration is not available in browser builds.");
  },
};
