'use client'
import AccessDeniedPage from "@/app/components/AccessDenied";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { AccessInfo } from "@/types";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { FaBox, FaCheck, FaWarehouse } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { FiShield, FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiSave, FiX, FiUser, FiSettings } from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { TbReport } from "react-icons/tb";

function AccessLevelModal({ isOpen, onClose, isEditing, onSaved, form, handleAccessFormChange, removeAccess, apiUpdateAccess, apiCreateAccess }: {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  onSaved: (access: AccessInfo) => void
  form: AccessInfo;
  handleAccessFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  removeAccess: (access: AccessInfo) => void;
  apiUpdateAccess: (access: AccessInfo) => Promise<AccessInfo>;
  apiCreateAccess: (access: AccessInfo) => Promise<AccessInfo>;
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setError(null);
    }, [form]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.Name || form.Name.trim().length < 2) { 
            setError("กรุณากรอก 'ชื่อระดับการเข้าถึง' อย่างน้อย 2 ตัวอักษร"); 
            return; 
        }
        try {
            setSaving(true); 
            setError(null);
            const payload: AccessInfo = {
                Level: form.Level,
                Name: form.Name!.trim(),
                Sys_Admin: !!form.Sys_Admin,
                User_Mgr: !!form.User_Mgr,
                Stock_Mgr: !!form.Stock_Mgr,
                Order_Mgr: !!form.Order_Mgr,
                Report: !!form.Report,
                Dashboard: !!form.Dashboard,
            };
            const access = isEditing ? await apiUpdateAccess(payload) : await apiCreateAccess(payload);
            onSaved(access);
            onClose();
        } catch (error: unknown) {
            console.log(error)
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
            <h3 className="font-bold text-lg flex items-center gap-2"><FiShield/>{isEditing ? `แก้ไขระดับการเข้าถึง: ${form.Level}` : "เพิ่มระดับการเข้าถึงใหม่"}</h3>
            {error && <div className="alert alert-error mt-3">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {!isEditing &&
                    <div>
                        <label className="label"><span className="label-text">ระดับ</span></label>
                        <input className="input input-bordered w-full" type="number" name="Level" value={form.Level ?? ""} onChange={handleAccessFormChange} min="0" required/>
                    </div>
                }

                <div>
                    <label className="label"><span className="label-text">ชื่อระดับการเข้าถึง</span></label>
                    <input className="input input-bordered w-full" name="Name" value={form.Name ?? ""} onChange={handleAccessFormChange} placeholder="เช่น ผู้จัดการระบบ" required/>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" name="Sys_Admin" className="checkbox checkbox-primary" checked={!!form.Sys_Admin} onChange={handleAccessFormChange} /> <span className="label-text">จัดการระบบ</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" name="User_Mgr" className="checkbox checkbox-primary" checked={!!form.User_Mgr} onChange={handleAccessFormChange} /> <span className="label-text">จัดการสมาชิก</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" name="Stock_Mgr" className="checkbox checkbox-primary" checked={!!form.Stock_Mgr} onChange={handleAccessFormChange} /> <span className="label-text">จัดการคลังสินค้า</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" name="Order_Mgr" className="checkbox checkbox-primary" checked={!!form.Order_Mgr} onChange={handleAccessFormChange} /> <span className="label-text">จัดการคำสั่งซื้อ</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" name="Report" className="checkbox checkbox-primary" checked={!!form.Report} onChange={handleAccessFormChange} /> <span className="label-text">จัดการรายงาน</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" name="Dashboard" className="checkbox checkbox-primary" checked={!!form.Dashboard} onChange={handleAccessFormChange} /> <span className="label-text">แดชบอร์ด</span>
                    </label>
                </div>

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose} disabled={saving}><FiX className="w-4 h-4"/> ยกเลิก</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="loading loading-spinner"/> : <><FiSave className="w-4 h-4"/> บันทึก</>}</button>
                    <button type="button" className="btn btn-error" onClick={() => removeAccess(form)} disabled={!isEditing}><FiTrash2 className="w-4 h-4"/> ลบระดับการเข้าถึง</button>
                </div>
            </form>
        </div>
    </dialog>
    );
}

export default function AccessManagementPage() {
    const { data: session, update } = useSession();
    const [accesses, setAccesses] = useState<AccessInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [form, setForm] = useState<AccessInfo>({
        Level: 0,
        Name: "",
        Sys_Admin: false,
        User_Mgr: false,
        Stock_Mgr: false,
        Order_Mgr: false,
        Report: false,
        Dashboard: true,
    });

    async function apiGetAccesses() {
        const result = await fetch("/api/master/access", { 
            cache: "no-store" 
        });
        if (!result.ok) {
            const body = await result.json();
            throw new Error(body.message || `HTTP Error ${result.status}`);
        }
        const response = await result.json();
        setAccesses(response.accesses);
    }

    async function apiCreateAccess(payload: AccessInfo): Promise<AccessInfo> {
        const result = await fetch("/api/master/access", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(payload) 
        });
        if (!result.ok) {
            const body = await result.json();
            throw new Error(body.message || `HTTP Error ${result.status}`);
        }
        const response = await result.json();
        return response.access;
    }

    async function apiUpdateAccess(payload: AccessInfo): Promise<AccessInfo> {
        const result = await fetch(`/api/master/access`, { 
            method: "PUT", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(payload) 
        });
        if (!result.ok) {
            const body = await result.json();
            throw new Error(body.message || `HTTP Error ${result.status}`);
        }
        const response = await result.json();
        return response.access;
    }

    async function apiDeleteAccess(id: number): Promise<{ ok: true }>{
        const res = await fetch(`/api/master/access`, { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(id)
        });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.message || `HTTP Error ${res.status}`);
        }
        return { ok: true };
    }

    const fetchAccesses = useCallback(async () => {
        try {
            setLoading(true); 
            setError(null);
            await apiGetAccesses();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            setError(message);
            setAccesses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchAccesses(); 
    }, [fetchAccesses]);

    function openCreate() { 
        setForm({ 
            Level: 0, 
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

    function openEdit(r: AccessInfo) { 
        setForm({
            Level: r.Level ?? 0,
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
    
    async function removeAccess(access: AccessInfo) {
        if (!access) return;
        
        if (!confirm(`ยืนยันการลบ ระดับการเข้าถึง : ${access.Level} (${access.Name}) ?`)) return;
        const { ok } = await apiDeleteAccess(access.Level);
        if (!ok) {
            setError(`ลบระดับการเข้าถึง ${access} (${access.Name}) ล้มเหลว!`)
        } else {
            setAccesses(prev => prev.filter(x => x.Level !== access.Level));
        }
    }
    
    const handleAccessFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    
    function onSaved(saved: AccessInfo) {
        if (session && saved.Level == session.user?.accessLevel) {
            update({
                user: {
                    ...session.user,
                    accessLevel: saved.Level
                },
            });
        }
        setAccesses(prev => {
            const idx = prev.findIndex(p => p.Level === saved.Level);
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
                            <h1 className="text-3xl font-bold text-base-content">จัดการระดับการเข้าถึง</h1>
                            <p className="text-base-content/70 mt-1">จัดการและติดตามข้อมูลระดับการเข้าถึง</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button className="btn btn-outline" onClick={fetchAccesses} disabled={loading}><FiRefreshCw/> โหลดใหม่</button>
                            <button className="btn btn-primary w-full sm:w-auto" onClick={openCreate}>
                                <FiPlus className="w-4 h-4" />
                                เพิ่มระดับการเข้าถึงใหม่
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="space-y-4">
                        {error && <div className="alert alert-error">{error}</div>}

                        {/* Access Table - Desktop View */}
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
                                    {accesses.length === 0 ? (
                                        <tr><td colSpan={9} className="text-center p-8 text-base-content/70">ไม่มีข้อมูล</td></tr>
                                    ) : (
                                        accesses.map(access => (
                                        <tr key={access.Level}>
                                            <td>{access.Level}</td>
                                            <td className="font-medium">{access.Name}</td>
                                            <td>{access.Sys_Admin ? <FaCheck/> : <FaX/>}</td>
                                            <td>{access.User_Mgr ? <FaCheck/> : <FaX/>}</td>
                                            <td>{access.Stock_Mgr ? <FaCheck/> : <FaX/>}</td>
                                            <td>{access.Order_Mgr ? <FaCheck/> : <FaX/>}</td>
                                            <td>{access.Report ? <FaCheck/> : <FaX/>}</td>
                                            <td>{access.Dashboard ? <FaCheck/> :<FaX/>}</td>
                                            <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-sm btn-ghost btn-square" onClick={()=>openEdit(access)}><FiEdit className="w-4 h-4"/></button>
                                                <button className="btn btn-sm btn-ghost btn-square text-error" onClick={()=>removeAccess(access)}><FiTrash2 className="w-4 h-4"/></button>
                                            </div>
                                            </td>
                                        </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Access Table - Mobile View */}
                        <div className="block md:hidden bg-base-100 rounded-lg shadow-sm p-4">
                            {accesses.length === 0 ? ( 
                                <p className="text-base-content/70">ไม่มีข้อมูล</p>
                            ) : (
                                accesses.map(access => (
                                <div key={access.Level} className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => openEdit(access)}>
                                    <div className="card-body p-4">
                                        <h2 className="card-title text-primary text-xl mb-2 flex items-center">
                                            <FiUser className="w-5 h-5 mr-2" /> {access.Name} # {access.Level}
                                        </h2>
                                        <p className="text-sm flex items-center gap-1">
                                            <FiSettings className="w-3 h-3" /> <strong>ระบบ :</strong> {access.Sys_Admin ? <FaCheck/> : <FaX/>}
                                        </p>
                                        <p className="text-sm flex items-center gap-1">
                                            <FiUser className="w-3 h-3" /> <strong>สมาชิก :</strong> {access.User_Mgr ? <FaCheck/> : <FaX/>}
                                        </p>
                                        <p className="text-sm flex items-center gap-1">
                                            <FaWarehouse className="w-3 h-3" /> <strong>คลังสินค้า :</strong> {access.Stock_Mgr ? <FaCheck/> : <FaX/>}
                                        </p>
                                        <p className="text-sm flex items-center gap-1">
                                            <FaBox className="w-3 h-3" /> <strong>คำสั่งซื้อ :</strong> {access.Order_Mgr ? <FaCheck/> : <FaX/>}
                                        </p>
                                        <p className="text-sm flex items-center gap-1">
                                            <TbReport className="w-3 h-3" /> <strong>รายงาน :</strong> {access.Report ? <FaCheck/> : <FaX/>}
                                        </p>
                                        <p className="text-sm flex items-center gap-1">
                                            <MdDashboard className="w-3 h-3" /> <strong>แดชบอร์ด :</strong> {access.Dashboard ? <FaCheck/> : <FaX/>}
                                        </p>
                                        <div className="card-actions justify-end mt-4">
                                            {/* Button to open modal in edit mode directly (optional, but good for direct access) */}
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click from also triggering
                                                    openEdit(access); // Open modal in view mode
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
            <AccessLevelModal 
                isOpen={modalOpen} 
                onClose={()=>setModalOpen(false)} 
                isEditing={isEditing} 
                onSaved={onSaved} 
                form={form} 
                handleAccessFormChange={handleAccessFormChange} 
                removeAccess={removeAccess}
                apiCreateAccess={apiCreateAccess}
                apiUpdateAccess={apiUpdateAccess}
            />
        </div>
    );
}
