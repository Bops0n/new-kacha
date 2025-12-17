import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { AccessInfo, UserAccount } from '@/types';
import { ACCESS_LEVEL_CONFIG } from '@/app/utils/client';

interface UserRowProps {
  user: UserAccount;
  access: AccessInfo | undefined;
  openUserModal: (user: UserAccount) => void;
  deleteUser: (userId: number) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  access,
  openUserModal,
  deleteUser,
}) => {
  
  const AccessInfo = ACCESS_LEVEL_CONFIG[access?.Level ?? 0];

  return (
    <tr className="hover cursor-pointer" onClick={() => openUserModal(user)}>
      <td><div className="font-bold text-primary">{user.User_ID}</div></td>
      <td>{user.Username}</td>
      <td>{user.Full_Name}</td>
      <td>{user.Email || '-'}</td>
      <td>{user.Phone || '-'}</td>
      <td>
        <span className={`badge ${AccessInfo.bgColor} ${AccessInfo.textColor}`}>{(!access ? 'ไม่ระบุ' : access.Name)}</span>
      </td>
      <td>
        <div className="flex gap-1">
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
