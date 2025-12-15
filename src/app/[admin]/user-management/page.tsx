'use client';

import { useState, useEffect } from 'react';
import {
  FiSearch,
  FiPlus,
  FiUser,
} from 'react-icons/fi';

import UserRow from './UserRow'; // Correct path to components
import UserCard from './UserCard'; // Correct path to components
import UserModal from './modal/UserModal'; // <-- นำเข้า UserModal
import AddressModal from '@/app/(main)/components/AddressModal'; // <-- นำเข้า AddressModal
import { useAlert } from '@/app/context/AlertModalContext';
import Pagination from '@/app/components/Pagination';
import { AccessInfo } from '@/types/';
import { AddressSchema, UserAccount, UserEditForm } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';

// Helper function to map access level char to readable string

const getAccessLevel = (accesses: AccessInfo[], level: number): AccessInfo | undefined => {
  return accesses.find(x => x.Level == level);
};

const getAccessLevelLabel = (accesses: AccessInfo[], level: number): string => {
  const access = getAccessLevel(accesses, level);
  if (!access) return "ไม่ระบุ";
  return access.Name;
};

export default function UserManagement() {
  const { showAlert } = useAlert();
  const { data: session, update } = useSession();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [accesses, setAccesses] = useState<AccessInfo[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accessLevelFilter, setAccessLevelFilter] = useState<number | 'all'>('all');

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // True for edit mode, false for add new

  const [editFormData, setEditFormData] = useState<UserEditForm>({
    User_ID: null,
    Username: '',
    Password: '',
    Full_Name: '',
    Email: '',
    Phone: '',
    Access_Level: 0,
    Addresses: [],
  });


  const [showAddAddressModal, setShowAddAddressModal] = useState<boolean>(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressSchema | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [paginatedUsers, setPaginatedUsers] = useState<UserAccount[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);



  // --- call data from api ---
  useEffect(() => {
    async function apiGetUsers() {
      try {
            setLoading(true); 
            const data = await fetch('../api/admin/user/getUsers')
            const response = await data.json()

            setUsers(response.users);
        } finally {
            setLoading(false);
        }
    }

    async function apiGetAccesses() {
      const result = await fetch("/api/master/access", { 
          cache: "no-store" 
      });
      const response = await result.json();
      setAccesses(response.accesses);
    }

    apiGetAccesses();
    apiGetUsers();
  },[])

  // --- Filtering Logic ---
  useEffect(() => {
    let filtered: UserAccount[] = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.Full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.Email && user.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.Phone && user.Phone.includes(searchTerm)) ||
        user.User_ID.toString().includes(searchTerm)
      );
    }

    if (accessLevelFilter !== 'all') {
      filtered = filtered.filter(user => user.Access_Level == accessLevelFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, accessLevelFilter, users]);

  // --- Pagination Logic ---
  useEffect(() => {
    const startIndex: number = (currentPage - 1) * itemsPerPage;
    const endIndex: number = startIndex + itemsPerPage;
    const paginated: UserAccount[] = filteredUsers.slice(startIndex, endIndex);

    setPaginatedUsers(paginated);
    setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage));
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // --- User Actions ---
  // Opens modal in VIEW mode
  const openUserModal = async(user: UserAccount) => {
    setSelectedUser(user);

    const response = await fetch(`../api/admin/user/getAddress?UserId=${user.User_ID}`)
    const data = await response.json()

    // Populate form data with current user's data for potential edit later
    setEditFormData({
      User_ID: user.User_ID,
      Username: user.Username,
      Password: user.Password,
      Full_Name: user.Full_Name,
      Email: user.Email || '',
      Phone: user.Phone || '',
      Access_Level: user.Access_Level,
      Addresses: data.addresses || [],
    });
    setIsEditing(false); // Set to view mode
    setShowUserModal(true);
  };

  // Toggles between VIEW and EDIT mode within the modal
  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
  };

  // Handles adding a new user, opens modal in ADD mode
  const handleAddUserClick = () => {
    setEditFormData({
      User_ID: null,
      Username: '',
      Password: '',
      Full_Name: '',
      Email: '',
      Phone: '',
      Access_Level: 0,
      Addresses: [],
    });
    setSelectedUser(null); // No user selected for new user
    setIsEditing(true); // Set to edit/add mode for new user
    setShowUserModal(true);
  };

  const saveUserDetails = async() => {

    if (!editFormData.Username) {
      showAlert('กรุณากรอก Username และ Full Name'); // Replace with custom modal
      // Using a placeholder for custom alert
      // showAlert('กรุณากรอก Username และ Full Name');
      return;
    }
    // Password validation only for new users or if password field is explicitly changed in edit mode
    if (!isEditing && !editFormData.Password) {
      showAlert('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
      // Using a placeholder for custom alert
      // showAlert('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
      return;
    }
    
    let newID : number = 0;
    if (selectedUser) {
      try {
        const response = await fetch('../api/admin/user/updateUser', {
          method : 'PATCH',
          body : JSON.stringify(editFormData)
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.message || `HTTP Error ${response.status}`);
        }

        const data = await response.json();

        if (session && editFormData.User_ID === Number(session.user?.id)) {
          await update({
            user: {
              ...session.user,
              name: editFormData.Full_Name,
              accessLevel: editFormData.Access_Level as number
            },
          });
        }

        showAlert(data.message, 'success');
      }
      catch (error : unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        showAlert(message, 'error');
        return;
      }
      
    } else {
      try {
          const response = await fetch('../api/admin/user/addUser',{
            method : 'POST',
            body : JSON.stringify(editFormData)
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.message || `HTTP Error ${response.status}`);
          }

          const data = await response.json();
          newID = data.User_ID;
          setEditFormData(prevFormData => ({ ...prevFormData, User_ID: newID }));

          showAlert(data.message, 'success');
        } catch (error : unknown) {
          const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
          showAlert(message, 'error');
          return;
        }
    }

    const newOrUpdatedUser: UserAccount = {
      User_ID: editFormData.User_ID !== null? editFormData.User_ID : newID, // Generate new ID for mock
      Username: editFormData.Username,
      Password: editFormData.Password, // Caution: In real app, never handle passwords like this
      Full_Name: editFormData.Full_Name,
      Email: editFormData.Email,
      Phone: editFormData.Phone || null,
      Access_Level: editFormData.Access_Level,
      Addresses: editFormData.Addresses,
    };

    if (isEditing && editFormData.User_ID !== null) {
      setUsers(prev => prev.map(u =>
        u.User_ID == newOrUpdatedUser.User_ID ? newOrUpdatedUser : u
      ));
    } else {
      setUsers(prev => [...prev, newOrUpdatedUser]);
    }

    setSelectedUser(newOrUpdatedUser);
    setIsEditing(false); // Switch back to view mode after saving
    //setShowUserModal(false); // Keep modal open in view mode after save
  };

  const deleteUser = async(userId: number) => {
    // if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ User ID: ${userId}?`)) return

    showAlert(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ User ID: ${userId}?`,'warning','แจ้งเตือน',async()=>{
      setUsers(prev => prev.filter(u => u.User_ID !== userId));
      const response = await fetch(`../api/admin/user/deleteUser?id=${userId}`,{
        method : 'DELETE',
      })
      if (response.ok){
        showAlert('ลบผู้ใช้สำเร็จ','info')
      }
      setShowUserModal(false);
    })
  };

  // --- Address Actions within User Modal ---
  const handleAddAddressClick = () => {
    if (selectedUser) {
      setAddressToEdit(null); // Not editing existing address
      setShowAddAddressModal(true);
    }
  };

  const handleEditAddressClick = (address: AddressSchema) => {
    setAddressToEdit(address); // Set the address being edited
    setShowAddAddressModal(true);
  };

  const saveAddress = async(newAddressForm : AddressSchema) => {
    if (!newAddressForm.Address_1 || !newAddressForm.District || !newAddressForm.Province || !newAddressForm.Zip_Code || !newAddressForm.Sub_District || !newAddressForm.Phone) {
      // alert('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน');
      // Using a placeholder for custom alert
      showAlert('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน');
      return;
    }

    if (selectedUser) {
      const updatedAddresses = [...editFormData.Addresses];
      const newOrUpdatedAddress: AddressSchema = {
        ...newAddressForm,
        Address_ID: newAddressForm.Address_ID || Date.now(),
        User_ID: selectedUser.User_ID,
        Address_2: newAddressForm.Address_2 || null,
      };

      if (addressToEdit) {

        const response = await fetch('../api/admin/user/updateAddress',{
          method: 'PATCH',
          body : JSON.stringify(newOrUpdatedAddress)
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.message || `HTTP Error ${response.status}`);
        }

        const index = updatedAddresses.findIndex(addr => addr.Address_ID == addressToEdit.Address_ID && addr.User_ID == addressToEdit.User_ID);
        if (index !== -1) {
          updatedAddresses[index] = newOrUpdatedAddress;
        }

        showAlert('แก้ไขที่อยู่่สำเร็จ', 'success');
      } else {
        const response = await fetch('../api/admin/user/addAddress',{
          method: 'POST',
          body : JSON.stringify(newOrUpdatedAddress)
        })

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.message || `HTTP Error ${response.status}`);
        }
        
        const data = await response.json()

        newOrUpdatedAddress.Address_ID = data.Address_ID;

        updatedAddresses.push(newOrUpdatedAddress);
      }

      if (newOrUpdatedAddress.Is_Default) {
        updatedAddresses.forEach(addr => {
          if (addr.Address_ID !== newOrUpdatedAddress.Address_ID) {
            addr.Is_Default = false;
          }
        });
      } else {
        if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.Is_Default)) {
          updatedAddresses[0].Is_Default = true;
        }
        showAlert('เพิ่มที่อยู่สำเร็จ', 'success')
      }
      
      setEditFormData(prev => ({ ...prev, Addresses: updatedAddresses }));
      setShowAddAddressModal(false);
      ;
      setAddressToEdit(null);

    }
    
  };


  const deleteAddress = async(addressId: number, userId: number) => {
    // if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบที่อยู่นี้?')) {
    showAlert(`คุณแน่ใจหรือไม่ท่จะลบที่อยู่นี้ : ${addressId}`,'warning','',async()=>{
      if (selectedUser) {
        await fetch(`../api/admin/user/deleteAddress?id=${addressId}`,{
          method:'DELETE'
        })
        const updatedAddresses = editFormData.Addresses.filter(addr => !(addr.Address_ID == addressId && addr.User_ID == userId));
        if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.Is_Default)) {
          updatedAddresses[0].Is_Default = true;
        }
        setEditFormData(prev => ({ ...prev, Addresses: updatedAddresses }));
      }
    })
    // }
  };

  // --- Form Change Handlers ---
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;

    let newValue: string | boolean = target.value;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      newValue = target.checked;
    }

    setEditFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };


  if (loading) return <LoadingSpinner />;
  if (!session || !session.user?.User_Mgr) return <AccessDeniedPage url="/admin"/>;

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content">จัดการข้อมูลผู้ใช้</h1>
              <p className="text-base-content/70 mt-1">จัดการและติดตามข้อมูลผู้ใช้ทั้งหมด</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn btn-primary w-full sm:w-auto" onClick={handleAddUserClick}>
                <FiPlus className="w-4 h-4" />
                เพิ่มผู้ใช้ใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4 z-10" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อผู้ใช้, ชื่อ - นามสกุล, อีเมล, เบอร์โทร..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                className="select select-bordered w-full"
                value={accessLevelFilter}
                onChange={(e) => setAccessLevelFilter(e.target.value as number | 'all')}
              >
                <option value="all">ระดับการเข้าถึงทั้งหมด</option>
                {accesses.map((access : AccessInfo) => (
                  <option key={access.Level} value={access.Level}>{access.Name}</option>
                ))}
              </select>
            </div>
            <div className="md:w-40">
              <select
                className="select select-bordered w-full"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              >
                <option value={5}>5 รายการ</option>
                <option value={10}>10 รายการ</option>
                <option value={20}>20 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table - Desktop View */}
        <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>User ID</th>
                  <th>ชื่อผู้ใช้</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>อีเมล</th>
                  <th>เบอร์โทร</th>
                  <th>ระดับการเข้าถึง</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user: UserAccount) => (
                  <UserRow
                    key={user.User_ID}
                    user={user}
                    openUserModal={openUserModal}
                    deleteUser={deleteUser}
                    access={getAccessLevel(accesses, user.Access_Level)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users List - Mobile View */}
        <div className="block md:hidden bg-base-100 rounded-lg shadow-sm p-4">
          {paginatedUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {paginatedUsers.map((user: UserAccount) => (
                <UserCard
                  key={user.User_ID}
                  user={user}
                  access={getAccessLevel(accesses, user.Access_Level)}
                  openUserModal={openUserModal}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiUser className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </div>

        {/* No users found message */}
        {paginatedUsers.length == 0 && filteredUsers.length == 0 && (
          <div className="text-center py-12">
            <FiUser className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}


        {/* Pagination Section */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-base-100 rounded-b-lg shadow-sm mt-4">
            <div className="text-sm text-base-content/70">
              แสดงรายการ {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredUsers.length)} จากทั้งหมด {filteredUsers.length} รายการ
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-1">
              <button
                className={`btn btn-sm ${currentPage == 1 ? 'btn-disabled' : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage == 1}
              >
                ก่อนหน้า
              </button>

              <div className="flex flex-wrap justify-center gap-1">
                <Pagination
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItemsCount={filteredUsers.length}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>

              <button
                className={`btn btn-sm ${currentPage == totalPages ? 'btn-disabled' : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage == totalPages}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}

        {/* Render UserModal */}
        <UserModal
          showModal={showUserModal}
          onClose={() => setShowUserModal(false)}
          selectedUser={selectedUser}
          isEditing={isEditing}
          toggleEditMode={toggleEditMode}
          editFormData={editFormData}
          handleUserFormChange={handleUserFormChange}
          saveUserDetails={saveUserDetails}
          deleteUser={deleteUser}
          getAccessLevelLabel={getAccessLevelLabel}
          handleAddAddressClick={handleAddAddressClick}
          handleEditAddressClick={handleEditAddressClick}
          deleteAddress={deleteAddress}
          accesses={accesses}
        />

        {/* Render AddressModal */}
        <AddressModal
        isOpen={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onSave={saveAddress}
        initialData={addressToEdit}
          // addressToEdit={addressToEdit
          // showModal={showAddAddressModal}
          // onClose={() => setShowAddAddressModal(false)}
          // addressToEdit={addressToEdit}
          // newAddressForm={newAddressForm}
          // handleAddressFormChange={handleAddressFormChange}
          // saveAddress={saveAddress}
        />

      </div>
    </div>
  );
}
