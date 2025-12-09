// types/user.types.ts
// import { AddressSchema } from './user.types'; // Assuming it's in the same file for self-reference if needed

// User schema
export interface UserSchema {
  User_ID: number;
  Username: string;
  Full_Name: string;
  Email: string | null;
  Phone: string | null;
  Access_Level: number;
  Addresses?: AddressSchema[];
}

export interface UserAccount {
    User_ID: number;
    Username: string;
    Password?: string; // This should be a hashed password
    Full_Name: string;
    Email: string;
    Phone: string | null;
    Access_Level: number;
    Addresses: AddressSchema[];
}

// Address schema
export interface AddressSchema {
  Address_ID: number | null;
  User_ID: number;
  Address_1: string;
  Address_2: string | null;
  Sub_District: string;
  District: string;
  Province: string;
  Zip_Code: string;
  Is_Default: boolean;
  Phone: string | null;
}

// Form data for adding/editing a new address
export interface NewAddressForm {
  Address_ID: number | null;
  User_ID: number;
  Address_1: string;
  Address_2: string | null;
  Sub_District: string;
  District: string;
  Province: string;
  Zip_Code: string;
  Is_Default: boolean;
  Phone: string;
}

// Type for User Edit Form (for admin user management)
export interface UserEditForm {
  User_ID: number | null;
  Username: string;
  Password?: string;
  Full_Name: string;
  Email: string;
  Phone: string | null;
  Access_Level: number;
  Addresses: AddressSchema[];
}