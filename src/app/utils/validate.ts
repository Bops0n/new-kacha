import { z } from "zod";

export const RegisterSchema = z.object({
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_\.]+$/),
    email: z.string().email(),
    password: z.string().min(6).max(128)
});

const UserMgrBaseSchema = {
    Username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_\.]+$/),
    Email: z.string().email(),
    Phone: z.string().min(10).max(10).regex(/^[0-9_\.]+$/)
};

export const UserMgrCreateSchema = z.object({
    ...UserMgrBaseSchema,
    Password: z.string().min(6).max(128)
});

export const UserMgrEditSchema = z.object({
    ...UserMgrBaseSchema,
    Password: z.string().min(6).max(128).optional()
});