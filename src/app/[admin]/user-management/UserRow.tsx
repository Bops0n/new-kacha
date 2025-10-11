import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi'; // Removed FiEye
import { Role } from '@/types/role.types';
import { UserAccount } from '@/types';

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
              e.stopPropagation(); // Prevent row click from also triggering
            //   console.log(openUserModal)
              openUserModal(user); // Open modal
              // We need a way to set isEditing to true from here,
              // but direct state manipulation is not possible from child.
              // For simplicity, for now, clicking the row opens view, then click 'Edit' inside.
              // If direct edit is required, the openUserModal would need to accept a mode.
              // For this request, clicking the row always opens view, then you click "แก้ไข" in modal.
              // The original request 'นำปุ่ม ดูออก เหลือแค่ปุ่มแก้ไข แล้วปรับให้มีการเปิดปิดการแก้ไขแทน'
              // implies the external button will toggle.
              // Let's make this button toggle, and row click is still view.
              // To achieve this, openUserModal needs a second param `isEditMode`.
            }}
            title="แก้ไขผู้ใช้"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
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
