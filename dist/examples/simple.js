"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const context = {
    count: 0
};
const states = {
    alpha: {
        isInitial: true,
    },
    beta: {}
};
const machine = (0, index_1.createStateMachine)({
    context,
    states
});
//# sourceMappingURL=simple.js.map