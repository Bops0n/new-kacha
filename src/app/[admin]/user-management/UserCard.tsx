import React from 'react';
import { FiUser, FiMail, FiPhone, FiKey, FiEdit } from 'react-icons/fi';
import { AccessInfo, UserAccount } from '@/types';
import { ACCESS_LEVEL_CONFIG } from '@/app/utils/client';

interface UserCardProps {
  user: UserAccount;
  access: AccessInfo | undefined;
  openUserModal: (user: UserAccount) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  access,
  openUserModal,
}) => {

  const AccessInfo = ACCESS_LEVEL_CONFIG[access?.Level ?? 0];

  return (
    <div className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => openUserModal(user)}>
      <div className="card-body p-4">
        <h2 className="card-title text-primary text-xl mb-2 flex items-center">
          <FiUser className="w-5 h-5 mr-2" /> {user.Full_Name}
        </h2>
        <p className="text-sm">
          <strong>User ID:</strong> {user.User_ID}
        </p>
        <p className="text-sm flex items-center gap-1">
          <FiMail className="w-3 h-3" /> <strong>อีเมล:</strong> {user.Email || '-'}
        </p>
        <p className="text-sm flex items-center gap-1">
          <FiPhone className="w-3 h-3" /> <strong>เบอร์โทร:</strong> {user.Phone || '-'}
        </p>
        <p className="text-sm flex items-center gap-1">
          <FiKey className="w-3 h-3" /> <strong>ระดับการเข้าถึง:</strong>{' '}
          <span className={`badge ${AccessInfo.bgColor} ${AccessInfo.textColor}`}>{(!access ? 'ไม่ระบุ' : access.Name)}</span>
        </p>
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              openUserModal(user);
            }}
          >
            <FiEdit className="w-4 h-4" /> แก้ไข
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
