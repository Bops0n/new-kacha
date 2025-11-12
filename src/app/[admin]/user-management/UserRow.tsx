import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi'; // Removed FiEye
import { Role, UserAccount } from '@/types';

interface UserRowProps {
  user: UserAccount;
  role: Role | undefined;
  openUserModal: (user: UserAccount) => void; // Changed from viewUserDetails
  deleteUser: (userId: number) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  role,
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
          !role ? 'badge-error' : 
          role.Sys_Admin ? 'badge-primary' : 
          role.User_Mgr ? 'badge-secondary' : 
          role.Stock_Mgr ? 'badge-accent' : 
          role.Order_Mgr ? 'badge-info' : 
          role.Report ? 'badge-success' : 
          role.Dashboard ? 'badge-warning' : 
          'badge-neutral'
          )}`}>
          {(
            !role ? 'ไม่ระบุ' : role.Name
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
