export type AccessInfo = {
    Level: number;
    Name: string;
    Sys_Admin: boolean;
    User_Mgr: boolean;
    Stock_Mgr: boolean;
    Order_Mgr: boolean;
    Report: boolean;
    Dashboard: boolean;
};

export type ACCESS_FLAG =
  | "Sys_Admin"
  | "User_Mgr"
  | "Stock_Mgr"
  | "Order_Mgr"
  | "Report"
  | "Dashboard";
