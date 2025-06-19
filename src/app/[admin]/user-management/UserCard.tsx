import React from 'react';
import { FiUser, FiMail, FiPhone, FiKey, FiEdit } from 'react-icons/fi'; // Removed FiEye, added FiEdit
import { User, AccessLevel } from '../../../types'; // Correct path to types

interface UserCardProps {
  user: User;
  getAccessLevelLabel: (level: AccessLevel) => string;
  openUserModal: (user: User) => void; // Changed from viewUserDetails
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  getAccessLevelLabel,
  openUserModal, // Renamed prop
}) => {
  return (
    // Make the entire card clickable to open the modal in view mode
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
          <FiKey className="w-3 h-3" /> <strong>ระดับ:</strong>{' '}
          <span className={`badge ${user.Access_Level === '9' ? 'badge-info' : user.Access_Level === '1' ? 'badge-primary' : 'badge-neutral'} ml-1`}>
            {getAccessLevelLabel(user.Access_Level)}
          </span>
        </p>
        <div className="card-actions justify-end mt-4">
          {/* Button to open modal in edit mode directly (optional, but good for direct access) */}
          <button
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from also triggering
              openUserModal(user); // Open modal in view mode
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
