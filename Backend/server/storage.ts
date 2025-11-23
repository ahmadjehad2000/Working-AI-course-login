import { type SelectUser, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// This file maintains the original storage interface structure
// but actual data operations are handled by PocketBase service

export interface IStorage {
  getUser(id: string): Promise<SelectUser | undefined>;
  getUserByUsername(username: string): Promise<SelectUser | undefined>;
  createUser(user: InsertUser): Promise<SelectUser>;
}

export class MemStorage implements IStorage {
  private users: Map<string, SelectUser>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<SelectUser | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<SelectUser | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username, // Using email as username
    );
  }

  async createUser(insertUser: InsertUser): Promise<SelectUser> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: SelectUser = { 
      ...insertUser, 
      id,
      created: now,
      updated: now
    };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
