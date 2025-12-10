export interface ContactInfo {
    Message_ID: number;
    Name: string;
    Email: string;
    Phone: string;
    Subject: string;
    Message: string;
    Is_Read: boolean;
    Created_At: string;
}

export type CONTACT_TYPE = "all" | "read" | "unread";