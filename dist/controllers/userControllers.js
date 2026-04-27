"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userServices_1 = require("../services/userServices");
const userService = new userServices_1.UserService();
class UserController {
    /**
     * Search users
     */
    async searchUsers(req, res) {
        try {
            const result = await userService.searchUsers(req.body);
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(req, res) {
        try {
            const user = await userService.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Create new user
     */
    async createUser(req, res) {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Update user
     */
    async updateUser(req, res) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Delete user
     */
    async deleteUser(req, res) {
        try {
            await userService.deleteUser(req.params.id);
            res.json({ success: true, message: "User deactivated successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get active users list
     */
    async getActiveUsers(req, res) {
        try {
            const users = await userService.getActiveUsers();
            res.json({ success: true, data: users });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get current user profile (based on auth)
     */
    async getCurrentUser(req, res) {
        try {
            // @ts-ignore - user is attached by auth middleware
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = UserController;
