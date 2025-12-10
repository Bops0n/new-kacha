'use client'
import AccessDeniedPage from "@/app/components/AccessDenied";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Role } from "@/types";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { FaBox, FaCheck, FaWarehouse } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { FiShield, FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiSave, FiX, FiUser, FiSettings } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { TbReport } from "react-icons/tb";

async function apiGetRoles(): Promise<Role[]> {
    const result = await fetch("/api/master/role", { 
        cache: "no-store" 
    });
    if (!result.ok) {
        const body = await result.json();
        throw new Error(body.error || `HTTP Error ${result.status}`);
    }
    return result.json();
}

async function apiCreateRole(payload: Partial<Role>): Promise<Role> {
    const result = await fetch("/api/master/role", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
    });
    if (!result.ok) {
        const body = await result.json();
        throw new Error(body.error || `HTTP Error ${result.status}`);
    }
    return result.json();
}

async function apiUpdateRole(payload: Partial<Role>): Promise<Role> {
    const result = await fetch(`/api/master/role`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
    });
    if (!result.ok) {
        const body = await result.json();
        throw new Error(body.error || `HTTP Error ${result.status}`);
    }
    return result.json();
}

async function apiDeleteRole(id: number): Promise<{ ok: true }>{
    const res = await fetch(`/api/master/role`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(id)
    });
    if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `HTTP Error ${res.status}`);
    }
    return { ok: true };
}

function RoleModal({ isOpen, onClose, isEditing, onSaved, form, handleRoleFormChange, removeRole }: {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  onSaved: (role: Role) => void
  form: Partial<Role>;
  handleRoleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  removeRole: (role: number) => void;
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setError(null);
    }, [form]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.Name || form.Name.trim().length < 2) { 
            setError("กรุณากรอก 'ชื่อบทบาท' อย่างน้อย 2 ตัวอักษร"); 
            return; 
        }
        try {
            setSaving(true); 
            setError(null);
            const payload: Partial<Role> = {
                Role: form.Role,
                Name: form.Name!.trim(),
                Sys_Admin: !!form.Sys_Admin,
                User_Mgr: !!form.User_Mgr,
                Stock_Mgr: !!form.Stock_Mgr,
                Order_Mgr: !!form.Order_Mgr,
                Report: !!form.Report,
                Dashboard: !!form.Dashboard,
            };
            const role = isEditing ? await apiUpdateRole(payload) : await apiCreateRole(payload);
            onSaved(role);
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            setError(message);
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    return (
    <dialog className="modal modal-open">
        <div className="modal-box w-11/12 max-w-2xl">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><FiX/></button>
        <h3 className="font-bold text-lg flex items-center gap-2"><FiShield/>{isEditing ? `แก้ไขบทบาท: ${form.Role}` : "เพิ่มบทบาทใหม่"}</h3>
        {error && <div className="alert alert-error mt-3">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {!isEditing &&
                <div>
                    <label className="label"><span className="label-text">ระดับ</span></label>
                    <input className="input input-bordered w-full" type="number" name="Role" value={form.Role ?? ""} onChange={handleRoleFormChange} min="0" required/>
                </div>
            }

            <div>
                <label className="label"><span className="label-text">ชื่อบทบาท</span></label>
                <input className="input input-bordered w-full" name="Name" value={form.Name ?? ""} onChange={handleRoleFormChange} placeholder="เช่น ผู้จัดการระบบ" required/>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" name="Sys_Admin" className="checkbox checkbox-primary" checked={!!form.Sys_Admin} onChange={handleRoleFormChange} /> <span className="label-text">จัดการระบบ</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" name="User_Mgr" className="checkbox checkbox-primary" checked={!!form.User_Mgr} onChange={handleRoleFormChange} /> <span className="label-text">จัดการสมาชิก</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" name="Stock_Mgr" className="checkbox checkbox-primary" checked={!!form.Stock_Mgr} onChange={handleRoleFormChange} /> <span className="label-text">จัดการคลังสินค้า</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" name="Order_Mgr" className="checkbox checkbox-primary" checked={!!form.Order_Mgr} onChange={handleRoleFormChange} /> <span className="label-text">จัดการคำสั่งซื้อ</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" name="Report" className="checkbox checkbox-primary" checked={!!form.Report} onChange={handleRoleFormChange} /> <span className="label-text">จัดการรายงาน</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" name="Dashboard" className="checkbox checkbox-primary" checked={!!form.Dashboard} onChange={handleRoleFormChange} /> <span className="label-text">แดชบอร์ด</span>
                </label>
            </div>

            <div className="modal-action">
            <button type="button" className="btn" onClick={onClose} disabled={saving}><FiX className="w-4 h-4"/> ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="loading loading-spinner"/> : <><FiSave className="w-4 h-4"/> บันทึก</>}</button>
            <button type="button" className="btn btn-error" onClick={() => removeRole(form.Role ?? -1)} disabled={!isEditing}><FiTrash2 className="w-4 h-4"/> ลบบทบาท</button>
            </div>
        </form>
        </div>
    </dialog>
    );
}

export default function RoleManagementPage() {
    const { data: session, update } = useSession();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [form, setForm] = useState<Partial<Role>>({
        Role: 0,
        Name: "",
        Sys_Admin: false,
        User_Mgr: false,
        Stock_Mgr: false,
        Order_Mgr: false,
        Report: false,
        Dashboard: true,
    });

    async function load() {
        try {
            setLoading(true); 
            setError(null);
            const roles = await apiGetRoles();
            setRoles(Array.isArray(roles) ? roles : []);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            setError(message);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { 
        load(); 
    }, []);

    function openCreate() { 
        setForm({ 
            Role: 0, 
            Name: "", 
            Sys_Admin: false, 
            User_Mgr: false, 
            Stock_Mgr: false, 
            Order_Mgr: false, 
            Report: false, 
            Dashboard: true 
        });
        setIsEditing(false); 
        setModalOpen(true);
    }

    function openEdit(r: Role) { 
        setForm({
            Role: r.Role ?? 0,
            Name: r.Name ?? "",
            Sys_Admin: !!r.Sys_Admin,
            User_Mgr: !!r.User_Mgr,
            Stock_Mgr: !!r.Stock_Mgr,
            Order_Mgr: !!r.Order_Mgr,
            Report: !!r.Report,
            Dashboard: r.Dashboard,
        });
        setIsEditing(true); 
        setModalOpen(true); 
    }
    
    async function removeRole(role: number) {
        if (role < 0) return;
        
        if (!confirm(`ยืนยันการลบ ระดับบทบาท : ${role} ?`)) return;
        const { ok } = await apiDeleteRole(role);
        if (!ok) {
            setError(`ลบระดับบทบาท ${role} ล้มเหลว!`)
        } else {
            setRoles(prev => prev.filter(x => x.Role !== role));
        }
    }
    
    const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target;
        const name = target.name;
        const value = target.value;
        const checked = (target as HTMLInputElement).checked;
        const type = target.type;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    
    function onSaved(saved: Role) {
        if (session && saved.Role == session.user?.accessLevel) {
            update({
                user: {
                    ...session.user,
                    accessLevel: saved.Role
                },
            });
        }
        setRoles(prev => {
            const idx = prev.findIndex(p => p.Role === saved.Role);
            if (idx === -1) return [saved, ...prev];
            const next = [...prev];
            next[idx] = saved; return next;
        });
    }

    if (loading) return <LoadingSpinner />;
    if (!session || !session.user?.Sys_Admin) return <AccessDeniedPage url="/admin"/>;

    return (
    <div className="min-h-screen bg-base-200 p-4">
        <div className="max-w-7xl mx-auto">
            <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-base-content">จัดการบทบาท</h1>
                        <p className="text-base-content/70 mt-1">จัดการและติดตามข้อมูลบทบาท</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button className="btn btn-outline" onClick={load} disabled={loading}><FiRefreshCw/> โหลดใหม่</button>
                        <button className="btn btn-primary w-full sm:w-auto" onClick={openCreate}>
                            <FiPlus className="w-4 h-4" />
                            เพิ่มบทบาท
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="space-y-4">
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Role Table - Desktop View */}
                    <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th>ระดับ</th>
                                        <th>ชื่อ</th>
                                        <th>ระบบ</th>
                                        <th>สมาชิก</th>
                                        <th>คลังสินค้า</th>
                                        <th>คำสั่งซื้อ</th>
                                        <th>รายงาน</th>
                                        <th>แดชบอร์ด</th>
                                        <th>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {roles.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center p-8 text-base-content/70">ไม่มีข้อมูล</td></tr>
                                ) : (
                                    roles.map(r => (
                                    <tr key={r.Role} className="">
                                        <td>{r.Role}</td>
                                        <td className="font-medium">{r.Name}</td>
                                        <td>{r.Sys_Admin ? <FaCheck/> : <FaX/>}</td>
                                        <td>{r.User_Mgr ? <FaCheck/> : <FaX/>}</td>
                                        <td>{r.Stock_Mgr ? <FaCheck/> : <FaX/>}</td>
                                        <td>{r.Order_Mgr ? <FaCheck/> : <FaX/>}</td>
                                        <td>{r.Report ? <FaCheck/> : <FaX/>}</td>
                                        <td>{r.Dashboard ? <FaCheck/> :<FaX/>}</td>
                                        <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-ghost btn-square" onClick={()=>openEdit(r)}><FiEdit className="w-4 h-4"/></button>
                                            <button className="btn btn-sm btn-ghost btn-square text-error" onClick={()=>removeRole(r.Role)}><FiTrash2 className="w-4 h-4"/></button>
                                        </div>
                                        </td>
                                    </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Role Table - Mobile View */}
                    <div className="block md:hidden bg-base-100 rounded-lg shadow-sm p-4">
                        {roles.length === 0 ? ( 
                            <p className="text-base-content/70">ไม่มีข้อมูล</p>
                        ) : (
                            roles.map(r => (
                            <div key={r.Role} className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => openEdit(r)}>
                                <div className="card-body p-4">
                                    <h2 className="card-title text-primary text-xl mb-2 flex items-center">
                                        <FiUser className="w-5 h-5 mr-2" /> {r.Name} # {r.Role}
                                    </h2>
                                    <p className="text-sm flex items-center gap-1">
                                        <FiSettings className="w-3 h-3" /> <strong>ระบบ :</strong> {r.Sys_Admin ? <FaCheck/> : <FaX/>}
                                    </p>
                                    <p className="text-sm flex items-center gap-1">
                                        <FiUser className="w-3 h-3" /> <strong>สมาชิก :</strong> {r.User_Mgr ? <FaCheck/> : <FaX/>}
                                    </p>
                                    <p className="text-sm flex items-center gap-1">
                                        <FaWarehouse className="w-3 h-3" /> <strong>คลังสินค้า :</strong> {r.Stock_Mgr ? <FaCheck/> : <FaX/>}
                                    </p>
                                    <p className="text-sm flex items-center gap-1">
                                        <FaBox className="w-3 h-3" /> <strong>คำสั่งซื้อ :</strong> {r.Order_Mgr ? <FaCheck/> : <FaX/>}
                                    </p>
                                    <p className="text-sm flex items-center gap-1">
                                        <TbReport className="w-3 h-3" /> <strong>รายงาน :</strong> {r.Report ? <FaCheck/> : <FaX/>}
                                    </p>
                                    <p className="text-sm flex items-center gap-1">
                                        <MdDashboard className="w-3 h-3" /> <strong>แดชบอร์ด :</strong> {r.Dashboard ? <FaCheck/> : <FaX/>}
                                    </p>
                                    <div className="card-actions justify-end mt-4">
                                        {/* Button to open modal in edit mode directly (optional, but good for direct access) */}
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click from also triggering
                                            openEdit(r); // Open modal in view mode
                                            }}
                                        >
                                        <FiEdit className="w-4 h-4" /> แก้ไข
                                        </button>
                                    </div>
                                </div>
                            </div>))
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Modal */}
        <RoleModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} isEditing={isEditing} onSaved={onSaved} form={form} handleRoleFormChange={handleRoleFormChange} removeRole={removeRole}/>
    </div>
    );
}
