"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = require("../models/User");
class UserRepository {
    async findByEmail(email) {
        return User_1.UserModel.findOne({ email });
    }
    async upsert(email, password, role) {
        return User_1.UserModel.findOneAndUpdate({ email }, { $set: { email, password, role } }, { upsert: true, new: true });
    }
}
exports.UserRepository = UserRepository;
