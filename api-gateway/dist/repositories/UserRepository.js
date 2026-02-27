"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = require("../models/User");
const errors_1 = require("../utils/errors");
class UserRepository {
    async findByEmail(email) {
        return User_1.UserModel.findOne({ email }).exec();
    }
    async upsert(email, password, role) {
        try {
            // First check if user already exists
            const existing = await User_1.UserModel.findOne({ email }).exec();
            if (existing) {
                throw new errors_1.AppError('User already exists', 409); // ← was: return existing
            }
            // Create new user safely
            const user = new User_1.UserModel({
                email,
                password,
                role
            });
            await user.save();
            return user;
        }
        catch (error) {
            // Re-throw AppErrors as-is (including the 409 above)
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            // CosmosDB duplicate key handling (race condition fallback)
            if (error?.code === 11000 ||
                error?.message?.includes('duplicate key') ||
                error?.message?.includes('E11000')) {
                throw new errors_1.AppError('User already exists', 409);
            }
            throw new errors_1.AppError('Failed to create user', 500);
        }
    }
}
exports.UserRepository = UserRepository;
