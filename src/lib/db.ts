import { PrismaClient } from '../../generated/prisma'
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from 'dotenv';
dotenv.config();

// initialize instance
const connectionString = process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("DATABASE_URL is not defined in .env file");
const pgPool = new Pool({ connectionString });
const adapter = new PrismaPg(pgPool);

export const prisma = new PrismaClient({ adapter });
