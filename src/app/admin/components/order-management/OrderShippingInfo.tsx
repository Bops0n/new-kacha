import { formatDateTimeShort } from "@/app/utils/formatters";
import { Order, OrderShipping } from "@/types";
import { MdOutlineLocalShipping } from "react-icons/md";

type OrderShippingProps = {
    IsReadOnly: boolean;
    order: Order;
    form: OrderShipping;
    handleFormChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
};

export default function OrderShippingInfo({ 
    IsReadOnly,
    order,
    form,
    handleFormChange = () => {}
}: OrderShippingProps) {
    return (
        <>
            {/* Form */}
            <div id="shipping" className="card bg-base-100 shadow-md border border-base-300 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <MdOutlineLocalShipping className="text-primary w-5 h-5" />
                    <h2 className="font-bold text-lg">ข้อมูลการจัดส่ง</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label-text font-semibold">
                            วิธีการจัดส่ง <span className="text-error">*</span>
                        </label>
                        <select
                            className={`select select-bordered w-full`}
                            name="Shipping_Method"
                            value={form.Shipping_Method}
                            onChange={handleFormChange}
                            disabled={IsReadOnly}
                        >
                            <option value="">เลือกวิธีการจัดส่ง</option>
                            <option value="shop_delivery">จัดส่งโดยร้าน</option>
                            <option value="third_party">ขนส่งเอกชน</option>
                            <option value="pickup">ลูกค้ามารับเอง</option>
                        </select>
                    </div>

                    <div>
                        <label className="label-text font-semibold">
                            ผู้ให้บริการขนส่ง <span className="text-error">*</span>
                        </label>
                        <input className={`input input-bordered w-full`}
                            name="Shipping_Provider"
                            value={form.Shipping_Provider}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                    <div>
                        <label className="label-text font-semibold">
                            วันที่จัดส่ง <span className="text-error">*</span>
                        </label>
                        <input type="datetime-local" className={`input input-bordered w-full`}
                            name={"Shipping_Date"}
                            value={form.Shipping_Date}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                    <div>
                        <label className="label-text font-semibold">ค่าขนส่ง</label>
                        <input type="number" className="input input-bordered w-full"
                            name="Shipping_Cost"
                            value={form.Shipping_Cost}
                            min={0}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                    <div>
                        <label className="label-text font-semibold">
                            ประเภทยานพาหนะ <span className="text-error">*</span>
                            </label>
                        <input className={`input input-bordered w-full`}
                            name="Vehicle_Type"
                            value={form.Vehicle_Type}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                    <div>
                        <label className="label-text font-semibold">
                            ชื่อคนขับ <span className="text-error">*</span>
                        </label>
                        <input className={`input input-bordered w-full`}
                            name="Driver_Name"
                            value={form.Driver_Name}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                    <div>
                        <label className="label-text font-semibold">
                            เบอร์โทรคนขับ <span className="text-error">*</span>
                        </label>
                        <input className={`input input-bordered w-full`}
                            name="Driver_Phone"
                            value={form.Driver_Phone}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                    <div>
                        <label className="label-text font-semibold">Tracking Number</label>
                        <input className="input input-bordered w-full"
                            name="Tracking_Number"
                            value={form.Tracking_Number}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="label-text font-semibold">Tracking URL</label>
                        <input className="input input-bordered w-full"
                            name="Tracking_URL"
                            value={form.Tracking_URL}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>

                </div>

                {/* Notes */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label-text font-semibold">โน้ตภายใน</label>
                        <textarea className="textarea textarea-bordered w-full h-28"
                            name="Internal_Note"
                            value={form.Internal_Note}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>
                    <div>
                        <label className="label-text font-semibold">โน้ตถึงลูกค้า</label>
                        <textarea className="textarea textarea-bordered w-full h-28"
                            name="Customer_Note"
                            value={form.Customer_Note}
                            onChange={handleFormChange}
                            readOnly={IsReadOnly}
                            disabled={IsReadOnly}
                        />
                    </div>
                </div>

                {/* Saved By */}
                <div className="mt-8 p-7 flex flex-col justify-between bg-base-200 rounded-2xl border border-base-300 shadow-inner">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm opacity-60">วันที่ – เวลาที่บันทึกข้อมูล</p>
                            <p className="text-xl font-bold mt-1">{formatDateTimeShort(order.Shipping_Updated_At)}</p>
                        </div>

                        <div>
                            <p className="text-sm opacity-60">ผู้บันทึกข้อมูล</p>
                            <p className="text-xl font-bold mt-1">{order.Shipping_Updated_By || "-"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}