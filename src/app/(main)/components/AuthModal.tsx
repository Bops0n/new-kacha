'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMail, FiLock, FiUser, FiCheckCircle } from 'react-icons/fi';
import { signIn, useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useSearchParams, useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {

  const { update } = useSession();
  const { showAlert } = useAlert();

    const searchParams = useSearchParams();
    const router = useRouter();
    const callbackUrl = searchParams.get("callbackUrl") ?? "";

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  const [loginFormData, setLoginFormData] = useState({
    usernameOremail: '',
    password: '',
    rememberMe: false,
  });

  const [registerFormData, setRegisterFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setLoginFormData({ usernameOremail: '', password: '', rememberMe: false });
      setRegisterFormData({ username: '', email: '', password: '', confirmPassword: '' });
    }
  }, [isOpen, initialTab]);


  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginFormData.usernameOremail || !loginFormData.password) {
      showAlert("กรุณากรอกบัญชีผู้ใช้และรหัสผ่าน!", 'warning');
      return;
    }

    const result = await signIn('credentials', {
      redirect: false,
      username: loginFormData.usernameOremail,
      password: loginFormData.password,
      rememberMe: loginFormData.rememberMe,
      callbackUrl: callbackUrl
    });

    if (result?.ok) router.push(callbackUrl);
    
    update();

    switch (result?.status)
    {
      case 200:
        setTimeout(() => {
          showAlert("เข้าสู่ระบบสำเร็จ!", 'success');
          onClose();
        }, 500);
        break;
      
      default: showAlert(`${result?.error}`, 'error'); return;
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerFormData.username || !registerFormData.email || !registerFormData.password || !registerFormData.confirmPassword) {
      showAlert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน!", 'warning');
      return;
    }
    if (registerFormData.password !== registerFormData.confirmPassword) {
      showAlert("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน!", 'warning');
      return;
    }
    
    const result = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(registerFormData),
    });
    
    const data = await result.json();
    
    switch (result.status)
    {
      case 200:
        setRegisterFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          showAlert("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ", 'success');
          setActiveTab('login');
        }, 500);
        break;
      
      default: showAlert(`${data.message}`, 'error'); return;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="modal-box w-full max-w-md bg-base-100 rounded-lg shadow-xl overflow-hidden p-0">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
          onClick={onClose}
        >
          ✕
        </button>

        <div role="tablist" className="tabs tabs-bordered tabs-lg w-full">
          <a
            role="tab"
            className={`tab flex-1 ${activeTab === 'login' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            เข้าสู่ระบบ
          </a>
          <a
            role="tab"
            className={`tab flex-1 ${activeTab === 'register' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            ลงทะเบียน
          </a>
        </div>

        <div className="p-8">
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-base-content text-center mb-6">เข้าสู่ระบบ</h2>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">อีเมล / ชื่อผู้ใช้</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
                  <input
                    type="text"
                    name="usernameOremail"
                    placeholder="your.email@example.com"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={loginFormData.usernameOremail}
                    onChange={handleLoginChange}
                    // required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">รหัสผ่าน</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
                  <input
                    type="password"
                    name="password"
                    placeholder="รหัสผ่านของคุณ"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={loginFormData.password}
                    onChange={handleLoginChange}
                    // required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="form-control">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={loginFormData.rememberMe}
                      onChange={handleLoginChange}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text text-base-content">จดจำฉัน</span>
                  </label>
                </div>
                <Link href="#" className="link link-hover text-primary">ลืมรหัสผ่าน?</Link>
              </div>

              <button type="submit" className="btn btn-primary w-full text-lg">
                เข้าสู่ระบบ
              </button>

              <p className="text-center text-sm text-base-content/80 mt-4">
                ยังไม่ได้เป็นสมาชิก?{' '}
                <button
                  type="button"
                  className="link link-hover text-primary font-semibold"
                  onClick={() => setActiveTab('register')}
                >
                  คลิกเพื่อลงทะเบียน
                </button>
              </p>

              {/* <div className="divider text-base-content/70">หรือ</div>

              <div className="flex flex-col gap-2">
                <button type="button" className="btn btn-outline w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  เข้าสู่ระบบด้วย Facebook
                </button>
                <button type="button" className="btn btn-outline w-full border-gray-400 text-gray-700 hover:bg-gray-700 hover:text-white">
                  เข้าสู่ระบบด้วย Google
                </button>
              </div> */}
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-base-content text-center mb-6">ลงทะเบียนบัญชีใหม่</h2>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">ชื่อผู้ใช้</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
                  <input
                    type="text"
                    name="username"
                    placeholder="example"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.username}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">อีเมล</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.email}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">รหัสผ่าน</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
                  <input
                    type="password"
                    name="password"
                    placeholder="ตั้งรหัสผ่านของคุณ"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base-content">ยืนยันรหัสผ่าน</span>
                </label>
                <div className="relative">
                  <FiCheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="ยืนยันรหัสผ่านของคุณ"
                    className="input input-bordered w-full pl-10 pr-4"
                    value={registerFormData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full text-lg">
                ลงทะเบียน
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
