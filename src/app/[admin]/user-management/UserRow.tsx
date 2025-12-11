import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi'; // Removed FiEye
import { AccessInfo, UserAccount } from '@/types';

interface UserRowProps {
  user: UserAccount;
  access: AccessInfo | undefined;
  openUserModal: (user: UserAccount) => void; // Changed from viewUserDetails
  deleteUser: (userId: number) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  access,
  openUserModal, // Renamed prop
  deleteUser,
}) => {
  return (
    // Make the entire row clickable to open the modal in view mode
    <tr className="hover cursor-pointer" onClick={() => openUserModal(user)}>
      <td><div className="font-bold text-primary">{user.User_ID}</div></td>
      <td>{user.Username}</td>
      <td>{user.Full_Name}</td>
      <td>{user.Email || '-'}</td>
      <td>{user.Phone || '-'}</td>
      <td>
        <span className={`badge ${(
          !access ? 'badge-error' : 
          access.Sys_Admin ? 'badge-primary' : 
          access.User_Mgr ? 'badge-secondary' : 
          access.Stock_Mgr ? 'badge-accent' : 
          access.Order_Mgr ? 'badge-info' : 
          access.Report ? 'badge-success' : 
          access.Dashboard ? 'badge-warning' : 
          'badge-neutral'
          )}`}>
          {(
            !access ? 'ไม่ระบุ' : access.Name
            )}
        </span>
      </td>
      <td>
        <div className="flex gap-1">
          {/* Button to open modal in edit mode directly (optional, but good for direct access) */}
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation();
              openUserModal(user);
            }}
            title="แก้ไขผู้ใช้"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation();
              deleteUser(user.User_ID);
            }}
            title="ลบ"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserRow;
