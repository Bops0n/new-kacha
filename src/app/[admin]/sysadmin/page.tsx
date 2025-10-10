'use client'
import { Role } from "@/types/role.types";
import React, { useEffect, useState } from "react";
import { FiSettings, FiShield, FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiSave, FiX, FiChevronRight, FiChevronDown } from "react-icons/fi";

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

function RoleModal({ isOpen, onClose, isEditing, onSaved, form, handleRoleFormChange }: {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  onSaved: (role: Role) => void
  form: Partial<Role>;
  handleRoleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
            const { role } : any = isEditing ? await apiUpdateRole(payload) : await apiCreateRole(payload);
            onSaved(role);
            onClose();
        } catch (e: any) {
            setError(e?.message ?? "บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    return (
    <dialog className="modal modal-open">
        <div className="modal-box w-11/12 max-w-2xl">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><FiX/></button>
        <h3 className="font-bold text-lg flex items-center gap-2"><FiShield/>{isEditing ? `แก้ไขบทบาท #${form.Role}` : "เพิ่มบทบาทใหม่"}</h3>
        {error && <div className="alert alert-error mt-3">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {!isEditing &&
                <div>
                    <label className="label"><span className="label-text">ระดับ</span></label>
                    <input className="input input-bordered w-full" type="number" name="Role" value={form.Role ?? ""} onChange={handleRoleFormChange} required/>
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
            <button type="button" className="btn" onClick={onClose} disabled={saving}><FiX/> ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="loading loading-spinner"/> : <><FiSave/> บันทึก</>}</button>
            </div>
        </form>
        </div>
    </dialog>
    );
}

export default function SystemAdminSettingsPage() {
    const [activeKey, setActiveKey] = useState<string>("access-level");
    const [treeOpen, setTreeOpen] = useState(true);

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Partial<Role> | null>(null);

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
            setLoading(true); setError(null);
            const { roles } : any = await apiGetRoles();
            setRoles(Array.isArray(roles) ? roles : []);
        } catch (e: any) {
            setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
            setRoles([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{ load(); }, []);

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
        setEditTarget(null); 
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
        setEditTarget(r); 
        setModalOpen(true); 
    }
    
    async function removeRole(r: Role) {
        if (!confirm(`ยืนยันการลบ ระดับบทบาท ${r.Role} : '${r.Name}' ?`)) return;
        const { ok } = await apiDeleteRole(r.Role);
        if (!ok) {
            setError(`ลบระดับบทบาท ${r.Role} : '${r.Name}' ล้มเหลว!`)
        } else {
            setRoles(prev => prev.filter(x => x.Role !== r.Role));
        }
    }
    
    const handleRoleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } : any = e.target;
        setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' && value < 0 ? 0 : value
        }));

        // (e)=>setForm(p=>({ ...p, Role: Number(e.target.value) < 0 ? 0 : Number(e.target.value) }))
    };
    
    function onSaved(saved: Role) {
        setRoles(prev => {
            const idx = prev.findIndex(p => p.Role === saved.Role);
            if (idx === -1) return [saved, ...prev];
            const next = [...prev];
            next[idx] = saved; return next;
        });
    }

    const roleCount = roles.length;

    return (
    <div className="min-h-screen bg-base-200 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        {/* Sidebar Tree */}
        <div className="card bg-base-100 shadow-sm p-4 h-fit md:sticky md:top-4">
            <button className="btn btn-ghost w-full justify-between" onClick={()=>setTreeOpen(o=>!o)}>
            <span className="flex items-center gap-2"><FiSettings/> ตั้งค่าระบบ</span>
            {treeOpen ? <FiChevronDown/> : <FiChevronRight/>}
            </button>
            {treeOpen && (
            <ul className="menu mt-2">
                <li>
                <a className={activeKey==='access-level' ? 'active' : ''} onClick={()=>setActiveKey('access-level')}><FiShield/> จัดการบทบาท</a>
                </li>
                {/* สามารถเพิ่มเมนูอื่น เช่น Users, Permissions templates, Audit logs ฯลฯ ได้ภายหลัง */}
            </ul>
            )}
        </div>

        {/* Right Content */}
        <div className="flex flex-col gap-4">
            {activeKey === 'access-level' && (
            <div className="space-y-4">
                <div className="bg-base-100 rounded-lg shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FiShield/><h2 className="text-lg font-bold">จัดการบทบาท</h2>
                    <span className="badge badge-info badge-outline">{roleCount} บทบาท</span>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline" onClick={load} disabled={loading}><FiRefreshCw/> โหลดใหม่</button>
                    <button className="btn btn-primary" onClick={openCreate}><FiPlus/> เพิ่มบทบาท</button>
                </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="bg-base-100 rounded-lg shadow-sm overflow-x-auto">
                <table className="table w-full">
                    <thead>
                    <tr>
                        <th>ระดับ</th>
                        <th>ชื่อ</th>
                        <th>จัดการระบบ</th>
                        <th>จัดการสมาชิก</th>
                        <th>จัดการคลังสินค้า</th>
                        <th>จัดการคำสั่งซื้อ</th>
                        <th>จัดการรายงาน</th>
                        <th>แดชบอร์ด</th>
                        <th>จัดการ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={8} className="text-center p-8"><span className="loading loading-spinner"/></td></tr>
                    ) : roles.length === 0 ? (
                        <tr><td colSpan={8} className="text-center p-8 text-base-content/70">ไม่มีข้อมูล</td></tr>
                    ) : (
                        roles.map(r => (
                        <tr key={r.Role} className="">
                            <td>{r.Role}</td>
                            <td className="font-medium">{r.Name}</td>
                            <td>{r.Sys_Admin ? "✓" : "-"}</td>
                            <td>{r.User_Mgr ? "✓" : "-"}</td>
                            <td>{r.Stock_Mgr ? "✓" : "-"}</td>
                            <td>{r.Order_Mgr ? "✓" : "-"}</td>
                            <td>{r.Report ? "✓" : "-"}</td>
                            <td>{r.Dashboard ? "✓" : "-"}</td>
                            <td>
                            <div className="flex gap-2">
                                <button className="btn btn-sm" onClick={()=>openEdit(r)}><FiEdit/></button>
                                <button className="btn btn-sm btn-error" onClick={()=>removeRole(r)}><FiTrash2/></button>
                            </div>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
                </div>
            </div>
            )}
        </div>
        </div>

        {/* Modal */}
        <RoleModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} isEditing={isEditing} onSaved={onSaved} form={form} handleRoleFormChange={handleRoleFormChange}/>
    </div>
    );
}
